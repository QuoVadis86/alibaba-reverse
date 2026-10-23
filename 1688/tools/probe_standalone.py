"""用 HTTP 和本地运行时试跑新滑块挑战，不启动浏览器。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.x5sec import (  # noqa: E402
    PageProfile,
    PointerEvent,
    ScratchDrag,
    endpoint_base_from_challenge,
    fetch_umid_token,
    prepare_question_request,
    prepare_verify_request,
)
from core.x5sec.pow import PowDetail  # noqa: E402
from get_challenge import ACTIONS, LinkType, get_challenge  # noqa: E402


DEFAULT_CAPTURE = Path(__file__).resolve().parents[2] / ".playwright-cli/fy_trace_current.json"
_CONFIG = re.compile(r"window\._config_\s*=\s*")


def _page_config(source: str) -> dict[str, object]:
    match = _CONFIG.search(source)
    if match is None:
        raise ValueError("挑战页缺少 _config_，链接可能已过期")
    config, _ = json.JSONDecoder().raw_decode(source, match.end())
    if not isinstance(config, dict):
        raise ValueError("挑战页 _config_ 格式错误")
    return config


def probe(link_type: LinkType, replay_capture: Path = DEFAULT_CAPTURE) -> dict[str, object]:
    capture = json.loads(replay_capture.read_text())
    user_agent = capture["page"]["userAgent"]
    events = tuple(
        PointerEvent(
            type=event["type"], x=event["x"], y=event["y"],
            time_stamp=event["timeStamp"], buttons=event.get("buttons", 1),
        )
        for event in capture["events"]
    )
    if not events:
        raise ValueError("轨迹采样为空")
    prior_verify = capture.get("verifyRequests") or []
    if not prior_verify:
        raise ValueError("轨迹采样缺少校验请求的几何值")
    replay_query = parse_qs(urlsplit(prior_verify[0]["url"]).query)
    replay_distance = abs(events[-1].x - events[0].x)
    replay_per = float(replay_query["per"][0])
    if replay_per <= 0:
        raise ValueError("轨迹采样的 per 无效")
    track_width = round((replay_distance + 24) / replay_per)
    max_slide_width = int(replay_query["width"][0])
    elapsed = int(replay_query["time"][0])

    challenge = get_challenge(link_type)
    with requests.Session() as session:
        session.headers["User-Agent"] = user_agent
        for cookie in challenge["cookies"]:
            session.cookies.set(
                cookie["name"], cookie["value"],
                domain=cookie["domain"], path=cookie["path"],
            )
        page_response = session.get(challenge["url"], timeout=20)
        page_response.raise_for_status()
        config = _page_config(page_response.text)
        umid_token = fetch_umid_token(user_agent)
        endpoint = endpoint_base_from_challenge(challenge["url"])

        def profile() -> PageProfile:
            request = requests.Request("GET", challenge["url"])
            cookie = session.prepare_request(request).headers.get("Cookie", "")
            return PageProfile(
                url=challenge["url"], user_agent=user_agent, cookie=cookie,
                token=config["NCTOKENSTR"], app_key=config["NCAPPKEY"],
                x5secdata=config["SECDATA"], umid_token=umid_token,
            )

        question = prepare_question_request(endpoint, profile())
        question_response = session.get(question.url, timeout=20)
        question_response.raise_for_status()
        question_body = question_response.json()
        if question_body.get("code") != 0:
            return {"challenge": link_type, "question_code": question_body.get("code")}

        drag = ScratchDrag(
            encrypt_token=question_body["data"]["encryptToken"],
            elapsed_ms=elapsed, drag_distance=min(max_slide_width, replay_distance),
            track_width=track_width, max_slide_width=max_slide_width,
        )
        verify = prepare_verify_request(
            endpoint, profile(), drag, PowDetail(**config["pp"]), events=events,
        )
        headers = {key: value for key, value in verify.headers.items() if key != "Cookie"}
        verify_response = session.get(verify.url, headers=headers, timeout=20)
        verify_response.raise_for_status()
        verify_body = verify_response.json()
        verify_query = parse_qs(urlsplit(verify.url).query)
        return {
            "challenge": link_type,
            "question_code": question_body.get("code"),
            "verify_code": verify_body.get("result", {}).get("code"),
            "x5sec_issued": bool(verify_response.headers.get("bx-x5sec")),
            "replayed_events": len(events),
            "fy_length": len(verify_query["ua"][0]),
            "nonce_length": len(verify_query["_rand"][0]),
            "et_length": len(verify.headers["bx-et"]),
            "pp_length": len(verify.headers["bx-pp"]),
        }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("link_type", choices=ACTIONS)
    parser.add_argument("--replay-capture", type=Path, default=DEFAULT_CAPTURE)
    args = parser.parse_args()
    try:
        result = probe(args.link_type, args.replay_capture)
    except Exception as exc:
        # 异常信息可能包含完整挑战地址和查询参数，故只报告类型。
        print(json.dumps({"error_type": type(exc).__name__}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
