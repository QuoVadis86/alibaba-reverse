from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.x5sec.slide_params import (
    ButtonRect,
    SlideRequestInput,
    TrackGeometry,
    build_slide_request,
)
from core.x5sec.pow import PowDetail, solve_pow

_RUNTIME = Path(__file__).resolve().parents[1] / "core/x5sec/runtime/js_runtime.cjs"


def _base11_digits(value: str) -> str:
    number = int(value, 16)
    digits = ""
    while number:
        number, remainder = divmod(number, 11)
        digits = "0123456789a"[remainder] + digits
    return digits or "0"


def _load_capture(path: Path) -> dict:
    if path.suffix != ".network":
        return json.loads(path.read_text())
    for line in path.open():
        if '"resource-snapshot"' not in line or "/_____tmd_____/slide?" not in line:
            continue
        snapshot = json.loads(line)["snapshot"]
        content_file = snapshot["response"]["content"].get("_file")
        body = (path.parent / content_file).read_text() if content_file else ""
        return {
            "url": snapshot["request"]["url"],
            "headers": {
                item["name"].lower(): item["value"]
                for item in snapshot["request"]["headers"]
            },
            "body": body,
        }
    raise ValueError("trace 中没有 /slide 请求")


def _run_js(payload: dict) -> dict:
    result = subprocess.run(
        ["node", str(_RUNTIME)],
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        capture_output=True,
        timeout=20,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip()[:400])
    return json.loads(result.stdout)


def compare(
    path: Path,
    canvas_path: Path | None = None,
    page_profile_path: Path | None = None,
) -> dict:
    capture = _load_capture(path)
    if "logs" in capture:
        page_profile = json.loads(page_profile_path.read_text()) if page_profile_path else {}
        capture["trace"] = {
            "page": page_profile,
            "calls": [
                {
                    "label": item["name"],
                    "args": item.get("args", []),
                    "output": item.get("out"),
                    "randomTape": item.get("tape", {}).get("random", []),
                    "timeTape": item.get("tape", {}).get("now", []),
                }
                for item in capture["logs"]
            ],
        }
    query = {key: values[0] for key, values in parse_qs(urlsplit(capture["url"]).query).items()}
    slide_data = json.loads(query["slidedata"])
    parameters = json.loads(slide_data["p"])
    ncbtn = [float(value) if "." in value else int(value) for value in parameters["ncbtn"].split("|")]
    geometry = [int(part) for part in _base11_digits(parameters["ncSessionID"]).split("a")]
    if len(geometry) != 4:
        raise ValueError("无法从 ncSessionID 还原轨道几何值")
    request = build_slide_request(
        SlideRequestInput(
            appkey=slide_data["a"],
            token=slide_data["t"],
            secdata=query["x5secdata"],
            fy_token=slide_data["n"],
            umid_token=parameters["umidToken"],
            rand_value=query["_rand"],
            button=ButtonRect(*ncbtn),
            track=TrackGeometry(*geometry),
            et_ready=parameters["et"] == "1",
            scene=slide_data["scene"],
            language=slide_data["lang"],
            ppt_ms=int(query["ppt"]) if "ppt" in query else None,
            landscape=query.get("landscape") == "1",
            timestamp_ms=int(query["ts"]),
            request_v=query["v"],
        )
    )
    headers = {key.lower(): value for key, value in capture.get("headers", {}).items()}
    result = {
        "response_code": json.loads(capture.get("body") or "{}").get("result", {}).get("code"),
        "query_exact": request.to_query_string() == urlsplit(capture["url"]).query,
    }

    pp_hex = headers.get("bx-pp")
    if pp_hex:
        plain = bytes.fromhex(pp_hex).decode("utf-8")
        parts = plain.split(":")
        result["pow_digest_exact"] = hashlib.md5(parts[2].encode()).hexdigest() == parts[1]
        pow_plain = ":".join([*parts[:6], parts[6].split("|", 1)[0]])
        result["pow_extra_chars"] = len(pp_hex) - len(pow_plain.encode().hex())
        result["pow_browser_length"] = len(pp_hex)
        fields = parts[2].split("|")
        detail = PowDetail(
            l=int(fields[0]),
            i=int(fields[1]),
            q=fields[2],
            t=fields[3],
            f=fields[4],
            k=fields[5],
            enc=parts[5],
        )
        local_pow = solve_pow(
            detail,
            nonce=parts[3],
            first_marker=fields[6],
            second_marker=fields[7],
            third_marker=fields[8],
        )
        local_plain = bytes.fromhex(local_pow.signature).decode("utf-8")
        result["pow_core_exact"] = local_plain.rsplit(":", 1)[0] == pow_plain.rsplit(":", 1)[0]
        result["pow_prefix_exact"] = pp_hex.startswith(local_pow.signature)
        result["pow_elapsed_ms"] = [int(parts[6].split("|", 1)[0]), local_pow.elapsed_ms]

    trace = capture.get("trace") or {}
    calls = trace.get("calls") or []
    if not calls:
        result["dynamic_capture"] = "missing"
        return result
    result["dynamic_capture"] = "present"
    page = trace.get("page") or {}
    page_input = {
        "url": page.get("url", ""),
        "userAgent": page.get("userAgent", ""),
        "cookie": page.get("cookie", ""),
        "referrer": page.get("referrer", ""),
        "token": page.get("token", ""),
        "appKey": page.get("appKey", ""),
        "x5secdata": page.get("x5secdata", ""),
        "umidToken": parameters["umidToken"],
        "screen": page.get("screen"),
        "viewport": page.get("viewport"),
    }
    by_label = {}
    expected = {"fy": slide_data["n"], "nonce": query["_rand"], "et": headers.get("bx-et")}
    for item in calls:
        if item["label"] in expected and item.get("output") == expected[item["label"]]:
            by_label[item["label"]] = item
    nonce = by_label.get("nonce")
    if nonce:
        payload = {
            "mode": "nonce_only",
            "fy": nonce["args"][0],
            "randomTape": nonce.get("randomTape", []),
            "timeTape": nonce.get("timeTape", []),
        }
        if len(nonce["args"]) > 1:
            payload["phase"] = nonce["args"][1]
        try:
            local = _run_js(payload)
        except RuntimeError as error:
            result["nonce_error"] = str(error)
        else:
            result["nonce_exact"] = local["nonce"] == nonce.get("output")
            result["nonce_random_calls"] = [len(nonce.get("randomTape", [])), local["randomConsumed"]]
            result["nonce_time_calls"] = [len(nonce.get("timeTape", [])), local["timeConsumed"]]
    fy = by_label.get("fy")
    if fy:
        payload = {
            "mode": "fy_nonce",
            "page": page_input,
            "record": any(item["label"] == "record" for item in calls),
            "events": [
                {
                    "type": item["type"],
                    "x": item["x"],
                    "y": item["y"],
                    "timeStamp": item["timeStamp"],
                    "buttons": item.get("buttons", 1),
                }
                for item in trace.get("events", [])
            ],
            "randomTape": fy.get("randomTape", []),
            "timeTape": fy.get("timeTape", []),
        }
        if fy.get("args"):
            payload["fyOptions"] = fy["args"][0]
        try:
            local = _run_js(payload)
        except RuntimeError as error:
            result["fy_error"] = str(error)
        else:
            result["fy_exact"] = local["fy"] == fy.get("output")
            result["fy_lengths"] = [len(fy.get("output", "")), len(local["fy"])]
            result["fy_random_calls"] = [len(fy.get("randomTape", [])), local["randomConsumed"]]
            result["fy_time_calls"] = [len(fy.get("timeTape", [])), local["timeConsumed"]]
    et = by_label.get("et")
    if et:
        payload = {
            "mode": "et",
            "page": page_input,
            "url": et["args"][0],
            "events": trace.get("events", []),
            "randomTape": et.get("randomTape", []),
            "timeTape": et.get("timeTape", []),
        }
        if canvas_path:
            payload["canvasData"] = canvas_path.read_text().rstrip("\n")
        try:
            local = _run_js(payload)
        except RuntimeError as error:
            result["et_error"] = str(error)
        else:
            result["et_exact"] = local["et"] == et.get("output")
            result["et_lengths"] = [len(et.get("output", "")), len(local["et"])]
            result["et_random_calls"] = [len(et.get("randomTape", [])), local["randomConsumed"]]
            result["et_time_calls"] = [len(et.get("timeTape", [])), local["timeConsumed"]]
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("capture", type=Path)
    parser.add_argument("--canvas-data", type=Path)
    parser.add_argument("--page-profile", type=Path)
    arguments = parser.parse_args()
    print(
        json.dumps(
            compare(arguments.capture, arguments.canvas_data, arguments.page_profile),
            ensure_ascii=False,
            indent=2,
        )
    )
