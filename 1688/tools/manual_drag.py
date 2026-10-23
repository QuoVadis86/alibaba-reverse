"""用 Playwright 采集人工拖拽，比较浏览器与本地参数。"""

from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.x5sec import PageProfile, PointerEvent, endpoint_base_from_challenge, sign_et  # noqa: E402
from core.x5sec.dynamic import make_fy_nonce  # noqa: E402
from core.x5sec.pp import generate_pp_sign  # noqa: E402
from core.x5sec.scratch_params import (  # noqa: E402
    ScratchContext, ScratchVerifyInput, build_verify_query,
)
from get_challenge import ACTIONS, get_challenge  # noqa: E402


_PWCLI = Path.home() / ".codex/skills/playwright/scripts/playwright_cli.sh"
_OUTPUT = Path(__file__).resolve().parents[2] / ".playwright-cli"
_STATE = _OUTPUT / "manual_drag_session.json"
_SETUP = Path(__file__).with_name("manual_drag_setup.js")
_COLLECT = Path(__file__).with_name("manual_drag_collect.js")


def _private_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as output:
        json.dump(value, output, ensure_ascii=False, indent=2)
        output.write("\n")
    path.chmod(0o600)


def _playwright(session: str, command: str, *args: str, timeout: int = 60) -> str:
    result = subprocess.run(
        [str(_PWCLI), f"-s={session}", command, *args],
        text=True, capture_output=True, timeout=timeout, check=False,
    )
    if result.returncode:
        raise RuntimeError(f"Playwright {command} 失败")
    return result.stdout


def _result(stdout: str) -> dict[str, object]:
    if "### Result\n" not in stdout:
        raise ValueError("Playwright 没有返回结果")
    value, _ = json.JSONDecoder().raw_decode(stdout.split("### Result\n", 1)[1])
    if not isinstance(value, dict):
        raise ValueError("Playwright 返回格式错误")
    return value


def start(link_type: str, *, browser_control: bool = False) -> dict[str, object]:
    if _STATE.exists():
        previous = _read_state()
        try:
            _playwright(str(previous["session"]), "close", timeout=15)
        except (RuntimeError, subprocess.TimeoutExpired):
            pass
        _STATE.unlink(missing_ok=True)
    challenge = get_challenge(link_type)
    session = f"x5_manual_{int(time.time())}"
    _playwright(session, "open", "about:blank", "--headed")
    try:
        code = _SETUP.read_text().replace(
            "CHALLENGE_PAYLOAD", json.dumps(challenge, ensure_ascii=False),
        ).replace("SESSION_PAYLOAD", json.dumps(session)).replace(
            "INTERCEPT_PAYLOAD", json.dumps(not browser_control),
        )
        result = _result(_playwright(session, "run-code", code, timeout=90))
        if not result.get("ready") or not result.get("buttonVisible"):
            raise ValueError("滑块页面没有就绪")
    except Exception:
        _playwright(session, "close", timeout=15)
        raise
    _private_json(_STATE, {"session": session, "link_type": link_type,
                           "browser_control": browser_control})
    return {"ready": True, "session": session, "link_type": link_type,
            "browser_control": browser_control}


def _read_state() -> dict[str, str | bool]:
    state = json.loads(_STATE.read_text())
    return {"session": state["session"], "link_type": state["link_type"],
            "browser_control": bool(state.get("browser_control"))}


def _capture(state: dict[str, str | bool]) -> dict[str, object] | None:
    result = _result(_playwright(
        str(state["session"]), "run-code", _COLLECT.read_text(), timeout=30,
    ))
    if not result.get("captured"):
        return None
    return json.loads(gzip.decompress(base64.b64decode(result["gzip"], validate=True)))


def status() -> dict[str, object]:
    state = _read_state()
    result = _result(_playwright(
        str(state["session"]), "run-code", _COLLECT.read_text(), timeout=30,
    ))
    event_count = result.get("eventCount")
    if result.get("captured"):
        capture = json.loads(gzip.decompress(base64.b64decode(result["gzip"], validate=True)))
        event_count = len(capture["verify"]["events"])
    return {"ready": result.get("ready"), "captured": result.get("captured"),
            "event_count": event_count}


def _verify(
    capture: dict[str, object], artifact_stem: str, *, submit: bool = True,
) -> dict[str, object]:
    page = capture["profile"]
    browser = capture["verify"]
    browser_query = parse_qs(urlsplit(browser["url"]).query)
    storage = browser.get("umidStorage") or page.get("umidStorage") or ""
    token = storage.split("@@", 1)[0]
    if not token:
        raise ValueError("页面本地存储中没有 UMID")
    profile = PageProfile(
        url=page["url"], user_agent=page["userAgent"],
        cookie=browser["headers"].get("cookie") or browser["cookie"],
        token=page["token"], app_key=page["appKey"],
        x5secdata=page["x5secdata"], referrer=page["referrer"],
        umid_token=token, umid_storage=storage,
    )
    page_events = tuple(
        PointerEvent(type=event["type"], x=event["x"], y=event["y"],
                     time_stamp=event["timeStamp"], buttons=event.get("buttons", 1))
        for event in browser["events"]
    )
    up_indices = [index for index, event in enumerate(page_events)
                  if event.type == "mouseup"]
    if not up_indices:
        raise ValueError("没有采到人工拖拽松开事件")
    up_index = up_indices[-1]
    down_indices = [index for index, event in enumerate(page_events[:up_index])
                    if event.type == "mousedown"]
    if not down_indices:
        raise ValueError("没有采到人工拖拽按下事件")
    events = page_events[down_indices[-1]:up_index + 1]
    question = capture["question"]
    if question.get("code") != 0:
        raise ValueError("浏览器题目接口没有成功返回")
    fy_nonce = make_fy_nonce(
        profile, phase=3, umid_token=token, record=True, events=events,
    )
    pp_sign = generate_pp_sign(
        page, capture["initCommands"], browser["ppCalls"],
        track=browser.get("ppTrack"),
    )
    width = int(browser_query["width"][0])
    track_width = round(page["sliderRect"]["width"])
    pointer_down = next((item["event"] for item in browser["ppCalls"]
                         if item["command"] == "_$SR" and item.get("event")), None)
    pointer_up = next((item["event"] for item in browser["ppCalls"]
                       if item["command"] == "_$PP" and item.get("event")), None)
    if pointer_down is None or pointer_up is None:
        raise ValueError("滑块原始坐标没有采齐")
    drag_distance = max(0, pointer_up["x"] - pointer_down["x"])
    verify_input = ScratchVerifyInput(
        encrypt_token=question["data"]["encryptToken"],
        elapsed_ms=int(browser_query["time"][0]),
        drag_distance=min(width, max(0, drag_distance)),
        track_width=track_width, max_slide_width=width,
        rand_value=fy_nonce.nonce,
        ppt_ms=int(browser_query["ppt"][0]) if "ppt" in browser_query else None,
        partitioned_label=browser_query.get("partitionedLabel", [None])[0],
        cookie_disabled=browser_query.get("cookieDisabled") == ["true"],
        request_v=browser_query.get("v", [None])[0],
    )
    context = ScratchContext(
        token=profile.token, app_key=profile.app_key,
        x5secdata=profile.x5secdata, ua=fy_nonce.fy,
        umid_token=fy_nonce.umid_token,
    )
    endpoint = endpoint_base_from_challenge(profile.url)
    url = f"{endpoint}/newslidevalidate?{build_verify_query(context, verify_input)}"
    headers = {
        "User-Agent": profile.user_agent, "Cookie": profile.cookie,
        "bx-et": sign_et(profile, url, events=page_events), "bx-pp": pp_sign,
    }
    local_query = parse_qs(urlsplit(url).query)
    comparison = {
        "fy_equal": local_query["ua"] == browser_query["ua"],
        "nonce_equal": local_query["_rand"] == browser_query["_rand"],
        "et_equal": headers["bx-et"] == browser["headers"].get("bx-et"),
        "pp_equal": pp_sign == browser["headers"].get("bx-pp"),
        "per_equal": local_query["per"] == browser_query["per"],
        "fy_lengths": [len(browser_query["ua"][0]), len(fy_nonce.fy)],
        "pp_lengths": [len(browser["headers"].get("bx-pp", "")), len(pp_sign)],
        "drag_event_count": len(events),
        "page_event_count": len(page_events),
    }
    _private_json(_OUTPUT / f"{artifact_stem}_local_request.json",
                  {"url": url, "headers": headers, "comparison": comparison})
    if not submit:
        return comparison
    _reserve_challenge(profile.x5secdata, artifact_stem)
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    body = response.json()
    return {**comparison,
            "verify_code": body.get("result", {}).get("code"),
            "x5sec_issued": bool(response.headers.get("bx-x5sec"))}


def _reserve_challenge(x5secdata: str, artifact_stem: str) -> None:
    marker_dir = _OUTPUT / "manual_drag_submissions"
    marker_dir.mkdir(parents=True, exist_ok=True)
    challenge_hash = hashlib.sha256(x5secdata.encode()).hexdigest()
    marker = marker_dir / f"{challenge_hash}.json"
    try:
        descriptor = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError as exc:
        raise ValueError("这道题的本地校验已提交过，避免重复消耗") from exc
    with os.fdopen(descriptor, "w", encoding="utf-8") as output:
        json.dump({"artifact_stem": artifact_stem, "submitted_at": time.time()}, output)


def _verify_control(capture: dict[str, object], artifact_stem: str) -> dict[str, object]:
    """原样转发被拦截的浏览器参数，只检验位置和 HTTP 提交流程。"""
    browser = capture["verify"]
    source_headers = browser["headers"]
    allowed = {"user-agent", "cookie", "bx-et", "bx-pp", "accept",
               "accept-language", "referer", "origin"}
    headers = {name: value for name, value in source_headers.items()
               if name.lower() in allowed}
    _private_json(_OUTPUT / f"{artifact_stem}_control_request.json",
                  {"url": browser["url"], "headers": headers})
    _reserve_challenge(capture["profile"]["x5secdata"], artifact_stem)
    response = requests.get(browser["url"], headers=headers, timeout=20)
    response.raise_for_status()
    body = response.json()
    return {"mode": "control", "verify_code": body.get("result", {}).get("code"),
            "x5sec_issued": bool(response.headers.get("bx-x5sec")),
            "event_count": len(browser["events"]),
            "browser_per": parse_qs(urlsplit(browser["url"]).query).get("per", [None])[0]}


def finish(*, control: bool = False) -> dict[str, object]:
    state = _read_state()
    capture = _capture(state)
    if capture is None:
        return {"captured": False, "message": "尚未检测到拖拽校验请求"}
    artifact_stem = str(state["session"])
    _private_json(_OUTPUT / f"{artifact_stem}_capture.json", capture)
    try:
        if state["browser_control"]:
            response = capture.get("verifyResponse") or {}
            body = response.get("body") or {}
            try:
                comparison = _verify(capture, artifact_stem, submit=False)
            except Exception as exc:
                comparison = {"local_error_type": type(exc).__name__}
            result = {"mode": "browser_control", **comparison,
                      "verify_code": body.get("result", {}).get("code"),
                      "x5sec_issued": response.get("x5secIssued", False),
                      "browser_response_captured": bool(response),
                      "browser_event_count": len(capture["verify"]["events"])}
        else:
            result = (_verify_control(capture, artifact_stem) if control
                      else _verify(capture, artifact_stem))
    finally:
        _playwright(artifact_stem, "close", timeout=15)
        _STATE.unlink(missing_ok=True)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    start_parser = commands.add_parser("start")
    start_parser.add_argument("link_type", choices=ACTIONS)
    start_parser.add_argument("--browser-control", action="store_true")
    commands.add_parser("status")
    finish_parser = commands.add_parser("finish")
    finish_parser.add_argument("--control", action="store_true")
    args = parser.parse_args()
    try:
        if args.command == "start":
            result = start(args.link_type, browser_control=args.browser_control)
        elif args.command == "status":
            result = status()
        else:
            result = finish(control=args.control)
    except Exception as exc:
        # Playwright 和 HTTP 异常可能带挑战地址，公开输出只保留异常类型。
        print(json.dumps({"error_type": type(exc).__name__}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
