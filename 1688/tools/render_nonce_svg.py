from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import html5lib


NAMED_COLORS = {
    "black": (0, 0, 0), "white": (255, 255, 255),
    "yellow": (255, 255, 0), "lime": (0, 255, 0),
    "darkcyan": (0, 139, 139), "darksalmon": (233, 150, 122),
    "darkgreen": (0, 100, 0), "lightgray": (211, 211, 211),
    "darkgray": (169, 169, 169),
    "darkmagenta": (139, 0, 139),
    "lightblue": (173, 216, 230),
    "teal": (0, 128, 128), "aqua": (0, 255, 255),
    "navy": (0, 0, 128), "olive": (128, 128, 0),
    "silver": (192, 192, 192), "gray": (128, 128, 128),
    "purple": (128, 0, 128), "fuchsia": (255, 0, 255),
    "red": (255, 0, 0), "green": (0, 128, 0), "blue": (0, 0, 255),
    "cyan": (0, 255, 255), "brown": (165, 42, 42),
    "darkred": (139, 0, 0), "darkorange": (255, 140, 0),
    "darkblue": (0, 0, 139), "darkorchid": (153, 50, 204),
    "darkviolet": (148, 0, 211),
    "orange": (255, 165, 0), "maroon": (128, 0, 0),
    "transparent": (0, 0, 0, 0),
}


def normalize_svg_markup(svg: str) -> str:
    fragment = html5lib.parseFragment(
        svg, treebuilder="etree", namespaceHTMLElements=False,
    )
    return html5lib.serialize(
        fragment, tree="etree", omit_optional_tags=False,
        quote_attr_values="always", alphabetical_attributes=False,
    )


def color(value: str) -> bytes:
    value = value.strip().lower()
    if value.startswith("#"):
        digits = value[1:]
        if len(digits) == 3:
            channels = tuple(int(digit * 2, 16) for digit in digits)
        elif len(digits) == 6:
            channels = tuple(int(digits[index:index + 2], 16) for index in (0, 2, 4))
        else:
            raise ValueError(f"unsupported color: {value}")
    elif match := re.fullmatch(r"rgb\((\d+),(\d+),(\d+)\)", value):
        channels = tuple(int(item) for item in match.groups())
    elif match := re.fullmatch(r"rgba\((\d+),(\d+),(\d+),([01](?:\.\d+)?)\)", value):
        channels = (*[int(item) for item in match.groups()[:3]],
                    round(float(match.group(4)) * 255))
    elif value in NAMED_COLORS:
        channels = NAMED_COLORS[value]
    else:
        raise ValueError(f"unsupported color: {value}")
    return bytes(channels if len(channels) == 4 else (*channels, 255))


def declarations(source: str) -> dict[str, str]:
    return dict(pair for declaration in source.split(";")
                if ":" in declaration
                for pair in [tuple(part.strip() for part in declaration.split(":", 1))])


def simple_selector(node: ET.Element, selector: str) -> bool:
    selector = selector.strip()
    tag = re.match(r"^(\*|[a-zA-Z]+)", selector)
    if tag:
        if tag.group(1) != "*" and not node.tag.endswith("}" + tag.group(1)):
            return False
        selector = selector[tag.end():]
    for match in re.finditer(r'\[([\w-]+)([~|^$*]?=)"([^"]*)"\]', selector):
        actual = node.attrib.get(match.group(1))
        expected = match.group(3)
        operator = match.group(2)
        if actual is None:
            return False
        if not {
            "=": actual == expected,
            "^=": actual.startswith(expected),
            "$=": actual.endswith(expected),
            "*=": expected in actual,
            "~=": expected in actual.split(),
            "|=": actual == expected or actual.startswith(expected + "-"),
        }[operator]:
            return False
    return re.sub(r'\[[^\]]+\]', "", selector).strip() == ""


def selector_matches(node: ET.Element, selector: str,
                     parents: dict[ET.Element, ET.Element]) -> bool:
    parts = re.findall(r'\[[^\]]+\]|[^\s>+~\[\]]+|[>+~]|\s+', selector)
    tokens: list[str] = []
    for part in parts:
        if part.isspace():
            if tokens and tokens[-1] not in {" ", ">", "+", "~"}:
                tokens.append(" ")
        elif part in {">", "+", "~"}:
            if tokens and tokens[-1] == " ":
                tokens.pop()
            tokens.append(part)
        else:
            if tokens and tokens[-1] not in {" ", ">", "+", "~"}:
                tokens[-1] += part
            else:
                tokens.append(part)
    if not tokens or not simple_selector(node, tokens[-1]):
        return False
    current = node
    index = len(tokens) - 2
    while index >= 1:
        relation, previous = tokens[index], tokens[index - 1]
        parent = parents.get(current)
        if relation == ">":
            if parent is None or not simple_selector(parent, previous):
                return False
            current = parent
        elif relation == " ":
            while parent is not None and not simple_selector(parent, previous):
                parent = parents.get(parent)
            if parent is None:
                return False
            current = parent
        else:
            if parent is None:
                return False
            siblings = list(parent)
            candidates = siblings[:siblings.index(current)]
            if relation == "+":
                candidates = candidates[-1:]
            matches = [candidate for candidate in candidates
                       if simple_selector(candidate, previous)]
            if not matches:
                return False
            current = matches[-1]
        index -= 2
    return True


def box_sides(value: str) -> tuple[int, int, int, int]:
    entries = [int(part.removesuffix("px")) for part in value.split()]
    if len(entries) == 1:
        return (entries[0],) * 4
    if len(entries) == 2:
        return entries[0], entries[1], entries[0], entries[1]
    if len(entries) == 3:
        return entries[0], entries[1], entries[2], entries[1]
    if len(entries) == 4:
        return tuple(entries)
    raise ValueError(f"unsupported box: {value}")


def paint_rect(pixels: bytearray, size: int, x: int, y: int,
               width: int, height: int, shade: bytes) -> None:
    left, top = max(0, x), max(0, y)
    right, bottom = min(size, x + width), min(size, y + height)
    if right <= left or bottom <= top or shade[3] == 0:
        return
    row = shade * (right - left)
    for coordinate in range(top, bottom):
        start = (coordinate * size + left) * 4
        pixels[start:start + len(row)] = row


def render(svg: str) -> bytes:
    root = ET.fromstring(svg)
    if root.attrib.get("width") != "1024" or root.attrib.get("height") != "1024":
        raise ValueError("unsupported SVG dimensions")
    if "<foreignObject" not in svg or "position:absolute" not in svg:
        raise ValueError("unsupported SVG layout")
    size = 1024
    pixels = bytearray(size * size * 4)
    foreign = next(node for node in root if node.tag.endswith("foreignObject"))
    container = next(node for node in foreign if node.tag.endswith("div"))
    parents = {child: parent for parent in root.iter() for child in parent}
    rules = [(selector.strip(), declarations(match.group(2)), order)
             for style_node in root.iter() if style_node.tag.endswith("style")
             for order, match in enumerate(re.finditer(
                 r"([^{}]+)\{([^{}]*)\}", style_node.text or ""))
             for selector in match.group(1).split(",")]

    def computed_style(node: ET.Element) -> dict[str, str]:
        selected: dict[str, tuple[tuple[int, int, int, int, int], str]] = {}

        def add(name: str, value: str, priority: tuple[int, int, int, int, int]) -> None:
            important = value.endswith("!important")
            if important:
                value = value.removesuffix("!important").strip()
            rank = (max(int(important), priority[0]), *priority[1:])
            if name == "border":
                match = re.fullmatch(r"(\d+)px solid (.+)", value)
                if match is None:
                    raise ValueError(f"unsupported border: {value}")
                add("border-width", match.group(1) + "px", rank)
                add("border-color", match.group(2), rank)
                return
            if name in {"margin", "padding"}:
                for side, amount in zip(("top", "right", "bottom", "left"),
                                        box_sides(value)):
                    add(f"{name}-{side}", f"{amount}px", rank)
                return
            if name not in selected or rank >= selected[name][0]:
                selected[name] = (rank, value)

        for selector, properties, order in rules:
            if selector_matches(node, selector, parents):
                specificity = (selector.count("["),
                               len(re.findall(r"(?:^|[\s>+~])[a-zA-Z]+", selector)))
                priority = (0, 0, *specificity, order)
                for name, value in properties.items():
                    add(name, value, priority)
        for name, value in declarations(node.attrib.get("style", "")).items():
            add(name, value, (0, 1, 0, 0, 0))
        return {name: value for name, (_, value) in selected.items()}

    def draw(node: ET.Element, parent_x: int, parent_y: int) -> None:
        if node.tag.endswith("style") or "hidden" in node.attrib:
            return
        style = computed_style(node)
        if style.get("display") == "none" or style.get("visibility") == "hidden":
            return
        x = (parent_x + int(style.get("left", "0px").removesuffix("px")) +
             int(style.get("margin-left", "0px").removesuffix("px")))
        y = (parent_y + int(style.get("top", "0px").removesuffix("px")) +
             int(style.get("margin-top", "0px").removesuffix("px")))
        width = int(style.get("width", "0px").removesuffix("px"))
        height = int(style.get("height", "0px").removesuffix("px"))
        border_width = int(style.get("border-width", "0px").removesuffix("px"))
        padding_left = int(style.get("padding-left", "0px").removesuffix("px"))
        padding_right = int(style.get("padding-right", "0px").removesuffix("px"))
        padding_top = int(style.get("padding-top", "0px").removesuffix("px"))
        padding_bottom = int(style.get("padding-bottom", "0px").removesuffix("px"))
        if style.get("box-sizing") == "border-box":
            width = max(0, width - 2 * border_width - padding_left - padding_right)
            height = max(0, height - 2 * border_width - padding_top - padding_bottom)
        painted_width = width + padding_left + padding_right
        painted_height = height + padding_top + padding_bottom
        background = style.get("background", "transparent")
        if border_width:
            paint_rect(pixels, size, x, y, painted_width + 2 * border_width,
                       painted_height + 2 * border_width,
                       color(style.get("border-color", "transparent")))
        paint_rect(pixels, size, x + border_width, y + border_width,
                   painted_width, painted_height, color(background))
        children = [child for child in node if not child.tag.endswith("style")]
        children.sort(key=lambda child: int(declarations(child.attrib.get("style", ""))
                                            .get("z-index", "0")))
        for child in children:
            draw(child, x + border_width + padding_left,
                 y + border_width + padding_top)

    children = [child for child in container if not child.tag.endswith("style")]
    children.sort(key=lambda child: int(declarations(child.attrib.get("style", ""))
                                        .get("z-index", "0")))
    container_style = computed_style(container)
    origin_x = int(container_style.get("margin-left", "0px").removesuffix("px"))
    origin_y = int(container_style.get("margin-top", "0px").removesuffix("px"))
    for child in children:
        draw(child, origin_x, origin_y)
    return bytes(pixels)


def fnv1a(data: bytes) -> int:
    state = 2166136261
    for byte in data:
        state = ((state * 16777619) ^ byte) & 0xFFFFFFFF
    return state


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("capture", type=Path, nargs="?")
    parser.add_argument("--raw", action="store_true")
    parser.add_argument("--normalize", action="store_true")
    parser.add_argument("--normalize-markup", action="store_true")
    args = parser.parse_args()
    if args.normalize_markup:
        sys.stdout.write(normalize_svg_markup(sys.stdin.read()))
        return
    if args.normalize:
        source = sys.stdin.read()
        if not source.startswith("data:image/svg+xml;base64,"):
            raise ValueError("expected SVG data URL")
        svg = base64.b64decode(source.split(",", 1)[1]).decode()
        normalized = normalize_svg_markup(svg)
        sys.stdout.write("data:image/svg+xml;base64," +
                         base64.b64encode(normalized.encode()).decode())
        return
    if args.raw:
        source = sys.stdin.read()
        if not source.startswith("data:image/svg+xml;base64,"):
            raise ValueError("expected SVG data URL")
        sys.stdout.buffer.write(render(base64.b64decode(source.split(",", 1)[1]).decode()))
        return
    if args.capture is None:
        parser.error("capture is required without --raw")
    capture = json.loads(args.capture.read_text(encoding="utf-8"))
    source = next(item["src"] for item in capture["nonceImageLoads"]
                  if item["src"].startswith("data:image/svg+xml;base64,"))
    pixels = render(base64.b64decode(source.split(",", 1)[1]).decode())
    print(json.dumps({"fnv": fnv1a(pixels),
                      "sha256": hashlib.sha256(pixels).hexdigest(),
                      "browserFnv": capture["nonceDigestTrace"][0]["hash"]}))


if __name__ == "__main__":
    main()
