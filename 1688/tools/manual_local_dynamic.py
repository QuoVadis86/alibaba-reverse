"""Capture a human drag with Playwright, block browser verify, submit locally."""

from __future__ import annotations

import argparse
import base64
import gzip
import json
import sys
import time
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from capture_dynamic import _local, build_capture_code, make_et_payload, make_nonce_payload
from diff_fy_trace import compare_call
from get_challenge import get_challenge
from manual_drag import _OUTPUT, _playwright, _private_json, _reserve_challenge, _result
from core.x5sec.pp import generate_pp_sign
from core.x5sec.scratch_params import JS_URI_SAFE


_STATE = _OUTPUT / "manual_local_dynamic_session.json"


def start() -> dict[str, str | bool]:
    if _STATE.exists():
        try:
            _playwright(_session(), "close", timeout=15)
        except (RuntimeError, OSError):
            pass
        _STATE.unlink(missing_ok=True)
    challenge = get_challenge("captchacapslidev2")
    session = f"x5_local_dynamic_{int(time.time())}"
    _playwright(session, "open", "about:blank", "--headed")
    try:
        code = build_capture_code(
            challenge, manual_drag=True, intercept_verify=True,
            startup_trace=True, trace_et_pc=True, trace_nonce_gt=True,
            probe_fy=True, trace_fy_branch=True,
        )
        ready = _result(_playwright(session, "run-code", code, timeout=120))
        if not ready.get("ready") or not ready.get("buttonVisible"):
            raise RuntimeError("challenge page did not become ready")
    except (RuntimeError, ValueError):
        _playwright(session, "close", timeout=15)
        raise
    _private_json(_STATE, {"session": session})
    return {"ready": True, "session": session}


def _session() -> str:
    return json.loads(_STATE.read_text(encoding="utf-8"))["session"]


def status() -> dict[str, int | bool]:
    state = _result(_playwright(_session(), "run-code", """
async (page) => ({ ready: Boolean(page.__dynamicCollect),
  snapshotCount: page.__dynamicSnapshots?.length || 0 })
"""))
    return {"ready": bool(state["ready"]),
            "snapshot_count": int(state["snapshotCount"])}


def _replace_query(url: str, replacements: dict[str, str]) -> str:
    parts = urlsplit(url)
    seen: set[str] = set()
    items: list[str] = []
    for pair in parts.query.split("&"):
        key, separator, _ = pair.partition("=")
        if key in replacements:
            items.append(f"{key}={quote(replacements[key], safe=JS_URI_SAFE)}")
            seen.add(key)
        else:
            items.append(pair)
    if seen != set(replacements):
        raise ValueError("verify URL is missing a dynamic query parameter")
    return urlunsplit((parts.scheme, parts.netloc, parts.path,
                       "&".join(items), parts.fragment))


def _submit(capture: dict, session: str) -> dict[str, bool | int | str]:
    if capture.get("interceptedVerify") is not True:
        raise ValueError("browser verify was not intercepted")
    calls = capture["calls"]
    if sorted(call["label"] for call in calls) != ["et", "fy", "nonce"]:
        raise ValueError("target dynamic call count is not one each")
    if len(capture["verifyRequests"]) != 1:
        raise ValueError("expected exactly one intercepted verify request")
    fy_call = next(call for call in calls if call["label"] == "fy")
    nonce_call = next(call for call in calls if call["label"] == "nonce")
    et_call = next(call for call in calls if call["label"] == "et")
    early = [entry for entry in capture["fyEarlyCalls"]
             if entry["name"] in ("getFYToken", "getUidToken")
             and entry["beforeHook"]]
    baseline = capture["fyProbe"]["call"]
    fy_report = compare_call(capture, fy_call, prior=[*early, baseline],
                             record=True, return_local_value=True)
    fy = fy_report.pop("localValue")
    nonce = _local(make_nonce_payload(capture, nonce_call, trace_gt=True,
                                      auto_env=True))["nonce"]
    pp = generate_pp_sign(capture["page"], capture["ppVmInitCalls"],
                          capture["ppVmDragCalls"], track=capture["ppVmTrack"])
    browser_request = capture["verifyRequests"][0]
    replacements = {"ua": fy, "_rand": nonce}
    local_url = _replace_query(browser_request["url"], replacements)
    et_input = _replace_query(et_call["args"][0], replacements)
    et_call_local = {**et_call, "args": [et_input]}
    browser_input_et = _local(make_et_payload(
        capture, et_call, replay_startup=True, trace_et_pc=True))["et"]
    et = _local(make_et_payload(capture, et_call_local,
                                replay_startup=True, trace_et_pc=True))["et"]
    comparison = {
        "fy_equal": fy == fy_call["output"],
        "nonce_equal": nonce == nonce_call["output"],
        "et_equal": browser_input_et == et_call["output"],
        "pp_equal": pp == browser_request["pp"],
        "url_equal": local_url == browser_request["url"],
    }
    source_headers = browser_request["headers"]
    allowed = {"user-agent", "cookie", "accept", "accept-language",
               "referer", "origin", "sec-ch-ua", "sec-ch-ua-mobile",
               "sec-ch-ua-platform"}
    headers = {name: value for name, value in source_headers.items()
               if name.lower() in allowed}
    headers["bx-et"] = et
    headers["bx-pp"] = pp
    _private_json(_OUTPUT / f"{session}_local_request.json",
                  {"url": local_url, "headers": headers, "comparison": comparison})
    _reserve_challenge(capture["page"]["x5secdata"], session)
    response = requests.get(local_url, headers=headers, timeout=20)
    response.raise_for_status()
    try:
        body = response.json()
    except requests.exceptions.JSONDecodeError:
        body = None
    _private_json(_OUTPUT / f"{session}_local_response.json",
                  {"status": response.status_code,
                   "content_type": response.headers.get("content-type"),
                   "headers": dict(response.headers),
                   "body_prefix": response.text[:5000]})
    return {**comparison,
            "event_count": len(capture["events"]),
            "verify_code": (body.get("result") or {}).get("code")
            if isinstance(body, dict) else None,
            "response_is_json": isinstance(body, dict),
            "response_status": response.status_code,
            "x5sec_issued": bool(response.headers.get("bx-x5sec"))}


def finish() -> dict[str, bool | int | str]:
    session = _session()
    try:
        packed = _result(_playwright(session, "run-code", """
async (page) => ({ snapshots: page.__dynamicSnapshots || [] })
""", timeout=120))
        snapshots = packed["snapshots"]
        if len(snapshots) != 1:
            return {"captured": False, "snapshot_count": len(snapshots)}
        capture = json.loads(gzip.decompress(
            base64.b64decode(snapshots[0]["gzip"], validate=True)))
        _private_json(_OUTPUT / f"{session}_capture.json", capture)
    finally:
        _playwright(session, "close", timeout=15)
        _STATE.unlink(missing_ok=True)
    return _submit(capture, session)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("start", "status", "finish"))
    command = parser.parse_args().command
    try:
        match command:
            case "start":
                result = start()
            case "status":
                result = status()
            case "finish":
                result = finish()
            case unreachable:
                raise AssertionError(unreachable)
    except (RuntimeError, ValueError, requests.RequestException, OSError) as exc:
        print(json.dumps({"error_type": type(exc).__name__}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
