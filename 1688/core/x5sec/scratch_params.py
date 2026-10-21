from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Final
from urllib.parse import quote

PAGE_VERSION: Final = "0.1.129"
FIREYE_VERSION: Final = "1.234.37"
JS_URI_SAFE: Final = "-_.!~*'()"


@dataclass(frozen=True, slots=True)
class ScratchContext:
    token: str
    app_key: str
    x5secdata: str
    ua: str
    umid_token: str
    language: str = "cn"
    page_version: str = PAGE_VERSION
    fireye_version: str = FIREYE_VERSION


@dataclass(frozen=True, slots=True)
class ScratchVerifyInput:
    encrypt_token: str
    elapsed_ms: int
    drag_distance: float
    track_width: int
    max_slide_width: int
    rand_value: str
    ppt_ms: int | None = None
    partitioned_label: str | None = None
    cookie_disabled: bool = False
    request_v: str | None = None


def build_question_query(
    context: ScratchContext,
    rand_value: str,
    *,
    request_v: str | None = None,
) -> str:
    pairs = [
        ("token", context.token),
        ("appKey", context.app_key),
        ("ua", context.ua),
        ("x5secdata", context.x5secdata),
        ("language", context.language),
    ]
    if context.page_version:
        pairs.append(("pageVersion", context.page_version))
    pairs.extend((("_rand", rand_value), ("v", _request_v(request_v))))
    return _encode(pairs)


def build_verify_query(context: ScratchContext, data: ScratchVerifyInput) -> str:
    if data.elapsed_ms < 0:
        raise ValueError("elapsed_ms 不能为负数")
    if data.track_width <= 0:
        raise ValueError("track_width 必须大于零")
    if data.max_slide_width < 0:
        raise ValueError("max_slide_width 不能为负数")
    if not 0 <= data.drag_distance <= data.max_slide_width:
        raise ValueError("drag_distance 必须在滑轨可拖动范围内")

    per_thousand = int((data.drag_distance + 24) / data.track_width * 1000 + 0.5)
    per = format(per_thousand / 1000, ".3f").rstrip("0").rstrip(".")
    pairs = [
        ("token", context.token),
        ("appKey", context.app_key),
        ("ua", context.ua),
        ("umidToken", context.umid_token),
        ("encryptToken", data.encrypt_token),
        ("x5secdata", context.x5secdata),
        ("time", str(data.elapsed_ms)),
    ]
    if context.page_version:
        pairs.append(("pageVersion", context.page_version))
    if context.fireye_version:
        pairs.append(("fireyeVersion", context.fireye_version))
    pairs.extend(
        (
            ("width", str(data.max_slide_width)),
            ("per", per),
        )
    )
    if data.partitioned_label:
        pairs.append(("partitionedLabel", data.partitioned_label))
    if data.cookie_disabled:
        pairs.append(("cookieDisabled", "true"))
    if data.ppt_ms is not None:
        pairs.append(("ppt", str(data.ppt_ms)))
    pairs.extend((("_rand", data.rand_value), ("v", _request_v(data.request_v))))
    return _encode(pairs)


def _request_v(value: str | None) -> str:
    return value if value is not None else "0" + str(secrets.randbelow(10**16)).zfill(16)


def _encode(pairs: list[tuple[str, str]]) -> str:
    return "&".join(
        f"{quote(name, safe=JS_URI_SAFE)}={quote(value, safe=JS_URI_SAFE)}"
        for name, value in pairs
    )
