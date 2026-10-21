from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from compare_x5sec import _run_js
from core.x5sec.pow import PowDetail, solve_pow
from core.x5sec.scratch_params import ScratchContext, ScratchVerifyInput, build_verify_query


def compare(
    capture_path: Path,
    *,
    canvas_path: Path | None = None,
    webgl_path: Path | None = None,
    track_width: int = 320,
) -> dict[str, object]:
    capture = json.loads(capture_path.read_text())
    parsed = urlsplit(capture["url"])
    if not parsed.path.endswith("/_____tmd_____/newslidevalidate"):
        raise ValueError("抓包不是 newslidevalidate 请求")
    query = {name: values[0] for name, values in parse_qs(parsed.query).items()}
    headers = {name.lower(): value for name, value in capture["headers"].items()}
    response = json.loads(capture.get("body") or "{}")
    result: dict[str, object] = {
        "response_code": response.get("result", {}).get("code"),
        "x5sec_issued": bool(capture.get("responseHeaders", {}).get("bx-x5sec")),
    }

    context = ScratchContext(
        token=query["token"],
        app_key=query["appKey"],
        x5secdata=query["x5secdata"],
        ua=query["ua"],
        umid_token=query["umidToken"],
        page_version=query.get("pageVersion", ""),
        fireye_version=query.get("fireyeVersion", ""),
    )
    drag_distance = float(query["per"]) * track_width - 24
    verify = ScratchVerifyInput(
        encrypt_token=query["encryptToken"],
        elapsed_ms=int(query["time"]),
        drag_distance=drag_distance,
        track_width=track_width,
        max_slide_width=int(query["width"]),
        rand_value=query["_rand"],
        ppt_ms=int(query["ppt"]) if "ppt" in query else None,
        partitioned_label=query.get("partitionedLabel"),
        cookie_disabled=query.get("cookieDisabled") == "true",
        request_v=query["v"],
    )
    result["query_rebuild_exact"] = build_verify_query(context, verify) == parsed.query

    signature = headers["bx-pp"]
    plain = bytes.fromhex(signature).decode("utf-8")
    parts = plain.split(":")
    fields = parts[2].split("|")
    detail = PowDetail(
        l=int(fields[0]), i=int(fields[1]), q=fields[2], t=fields[3],
        f=fields[4], k=fields[5], enc=parts[5],
    )
    local_pow = solve_pow(
        detail, nonce=parts[3], first_marker=fields[6],
        second_marker=fields[7], third_marker=fields[8],
    )
    result["pow_digest_exact"] = hashlib.md5(parts[2].encode()).hexdigest() == parts[1]
    result["pow_prefix_exact"] = signature.startswith(local_pow.signature)
    local_plain = bytes.fromhex(local_pow.signature).decode("utf-8")
    browser_core = plain.rsplit(":", 1)[0]
    result["pow_core_exact"] = local_plain.rsplit(":", 1)[0] == browser_core
    result["pow_elapsed_ms"] = [int(parts[6].split("|", 1)[0]), local_pow.elapsed_ms]
    result["pow_unexplained_hex_chars"] = len(signature) - len(local_pow.signature)

    trace = capture.get("trace") or {}
    calls = trace.get("calls") or []
    page = trace.get("page") or {}
    page_input = {
        "url": page.get("url", ""),
        "userAgent": page.get("userAgent", ""),
        "cookie": page.get("cookie", ""),
        "referrer": page.get("referrer", ""),
        "token": page.get("token", ""),
        "appKey": page.get("appKey", ""),
        "x5secdata": page.get("x5secdata", ""),
        "umidToken": query["umidToken"],
        "screen": page.get("screen"),
        "viewport": page.get("viewport"),
    }
    expected = {"fy": query["ua"], "nonce": query["_rand"], "et": headers["bx-et"]}
    matched = {
        label: next(
            (call for call in reversed(calls)
             if call.get("label") == label and call.get("output") == value),
            None,
        )
        for label, value in expected.items()
    }
    result["captured_matching_calls"] = {key: call is not None for key, call in matched.items()}
    events = trace.get("events") or []
    result["captured_event_count"] = len(events)
    result["events_complete"] = len(events) < trace.get("eventLimit", 1000)

    fy = matched["fy"]
    if fy:
        record = next(
            (call for call in reversed(calls[:calls.index(fy)]) if call.get("label") == "record"),
            None,
        )
        start = record.get("eventIndex", 0) if record else 0
        end = fy.get("eventIndex", len(events))
        payload = {
            "mode": "fy_nonce", "page": page_input, "record": record is not None,
            "events": events[start:end],
            "randomTape": fy.get("randomTape", []),
            "timeTape": fy.get("timeTape", []),
        }
        if webgl_path:
            payload["webglProfile"] = json.loads(webgl_path.read_text())
        if canvas_path:
            payload["canvasData"] = canvas_path.read_text().rstrip("\n")
        try:
            local = _run_js(payload)
            result["fy_replay_exact"] = local["fy"] == fy["output"]
            result["fy_lengths"] = [len(fy["output"]), len(local["fy"])]
        except RuntimeError as error:
            result["fy_replay_error"] = str(error)[:300]

    nonce = matched["nonce"]
    if nonce:
        try:
            local = _run_js({
                "mode": "nonce_only", "fy": nonce["args"][0],
                "phase": nonce["args"][1],
                "randomTape": nonce.get("randomTape", []),
                "timeTape": nonce.get("timeTape", []),
            })
            result["nonce_replay_exact"] = local["nonce"] == nonce["output"]
            result["nonce_lengths"] = [len(nonce["output"]), len(local["nonce"])]
            browser_bytes = base64.urlsafe_b64decode(nonce["output"])
            local_bytes = base64.urlsafe_b64decode(local["nonce"])
            mismatches = [
                index for index, (browser_byte, local_byte) in enumerate(
                    zip(browser_bytes, local_bytes, strict=True)
                ) if browser_byte != local_byte
            ]
            result["nonce_different_byte_count"] = len(mismatches)
            result["nonce_first_different_bytes"] = mismatches[:16]
        except RuntimeError as error:
            result["nonce_replay_error"] = str(error)[:300]

    et = matched["et"]
    if et:
        payload = {
            "mode": "et", "page": page_input, "url": et["args"][0],
            "events": events[:et.get("eventIndex", len(events))],
            "randomTape": et.get("randomTape", []),
            "timeTape": et.get("timeTape", []),
        }
        if canvas_path:
            payload["canvasData"] = canvas_path.read_text().rstrip("\n")
        try:
            local = _run_js(payload)
            result["et_replay_exact"] = local["et"] == et["output"]
            result["et_lengths"] = [len(et["output"]), len(local["et"])]
        except RuntimeError as error:
            result["et_replay_error"] = str(error)[:300]
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("capture", type=Path)
    parser.add_argument("--canvas-data", type=Path)
    parser.add_argument("--webgl-profile", type=Path)
    parser.add_argument("--track-width", type=int, default=320)
    arguments = parser.parse_args()
    print(json.dumps(compare(
        arguments.capture,
        canvas_path=arguments.canvas_data,
        webgl_path=arguments.webgl_profile,
        track_width=arguments.track_width,
    ), ensure_ascii=False, indent=2))
