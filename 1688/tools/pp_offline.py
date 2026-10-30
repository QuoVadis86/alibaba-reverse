"""完全离线的 x5sec 滑块请求：不启动浏览器。

流程：

1. 铸造挑战（MTOP 请求）；
2. 用同一份 Cookie GET 处罚页 HTML，解析内联的 `_config_`；
3. 生成拖拽轨迹；
4. 本地算 FY（`n` / `umidToken`）、nonce（`_rand`）、ET（`bx-et`）、PoW；
5. 组装 `slidedata`；
6. 本地 VM 追加段得到 `bx-pp`；
7. 本地发送并判定 `result.code`。

用法：

    uv run --project 1688 python 1688/tools/pp_offline.py --seed 5
    uv run --project 1688 python 1688/tools/pp_offline.py --seed 5 --trials 5
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.x5sec.dynamic import PageProfile, PointerEvent, make_fy_nonce, sign_et  # noqa: E402
from core.x5sec.pow import PowDetail, solve_pow  # noqa: E402
from core.x5sec.pp import generate_pp_sign  # noqa: E402
from core.x5sec.slide_params import (  # noqa: E402
    ButtonRect,
    SlideRequestInput,
    TrackGeometry,
    build_slide_request,
)
from core.x5sec.trajectory import Constraints, generate, generate_like, load_templates  # noqa: E402
from tools.get_challenge import OUTPUT_DIR, request_challenge  # noqa: E402

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"
)
# 控件几何：1180x780 视口下实测，控件本身尺寸固定。
BUTTON = ButtonRect(x=442, y=477, width=42, height=30, top=477, bottom=507, left=442, right=484)
TRACK = TrackGeometry(width=300, height=34, absolute_left=440, absolute_top=475)
DRAG_COMMANDS = ("_$PP", "_$PR", "_$PS")
INIT_COMMANDS = (
    "_$PI", "_$PA", "_$PE", "_$PX", "_$PH", "_$PB", "_$PF", "_$PG", "_$PL", "_$PM", "_$PN",
)
CONFIG_RE = re.compile(r"_config_\s*=\s*(\{.*?\})\s*;", re.S)
UMID_URL = "https://ynuf.aliapp.org/w/wu.json"


def fetch_config(session: requests.Session, url: str) -> dict[str, Any]:
    """GET 处罚页并解析内联 `_config_`。"""
    response = session.get(url, timeout=20)
    response.raise_for_status()
    match = CONFIG_RE.search(response.text)
    if not match:
        raise RuntimeError("处罚页里没有找到 _config_")
    return json.loads(match.group(1))


def fetch_umid(session: requests.Session) -> str:
    response = session.get(UMID_URL, timeout=15)
    match = re.search(r"__fycb\('([^']+)'\)", response.text)
    if not match:
        raise RuntimeError("umid 端点没有返回 __fycb")
    return match.group(1)


def trajectory_events(points, distance: float) -> tuple[PointerEvent, ...]:
    events = [PointerEvent(type="mousedown", x=int(points[0].x * distance), y=0,
                           time_stamp=int(points[0].t_ms), buttons=1)]
    events.extend(
        PointerEvent(type="mousemove", x=int(point.x * distance), y=0,
                     time_stamp=int(point.t_ms), buttons=1)
        for point in points[::4]
    )
    events.append(PointerEvent(type="mouseup", x=int(points[-1].x * distance), y=0,
                               time_stamp=int(points[-1].t_ms), buttons=0))
    return tuple(events)


def attempt(seed: int, templates: list, distance: float, dry_run: bool) -> dict[str, Any]:
    challenge = request_challenge()
    if not challenge.get("url"):
        raise RuntimeError("未取得挑战")

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    for cookie in challenge["cookies"]:
        session.cookies.set(cookie["name"], cookie["value"],
                            domain=cookie["domain"], path=cookie["path"])

    config = fetch_config(session, challenge["url"])
    token = config["NCTOKENSTR"]
    app_key = config["NCAPPKEY"]
    secdata = config["SECDATA"]
    host = config["HOST"]
    path = config["PATH"]
    pp = config["pp"]

    profile = PageProfile(
        url=challenge["url"], user_agent=USER_AGENT, cookie="; ".join(
            f"{c['name']}={c['value']}" for c in challenge["cookies"]),
        token=token, app_key=app_key, x5secdata=secdata,
    )

    constraints = Constraints(seed=seed, sample_hz=250.0)
    if templates:
        points = generate_like(templates[seed % len(templates)], (0.0, 0.0), (1.0, 0.0), constraints)
    else:
        points = generate((0.0, 0.0), (1.0, 0.0), constraints)
    events = trajectory_events(points, distance)

    umid = fetch_umid(session)
    fy = make_fy_nonce(profile, phase=1, umid_token=umid, events=events)
    et = sign_et(profile, f"//{host}{path}/_____tmd_____/slide", events=events)

    pow_detail = PowDetail(l=int(pp["l"]), i=int(pp["i"]), q=pp["q"], t=pp["t"],
                           f=pp["f"], k=pp["k"], enc=pp["enc"], mt=int(pp["mt"]))
    solved = solve_pow(pow_detail, first_marker="1", second_marker="1", third_marker="")

    sign = generate_pp_sign(
        {
            "url": challenge["url"], "token": token, "appKey": app_key, "x5secdata": secdata,
            "host": host, "path": path, "action": config.get("action", "captcha"),
            "pp": pp, "ppSign": solved.signature, "ppt": solved.elapsed_ms,
            "cookie": profile.cookie, "referrer": "", "title": "", "userAgent": USER_AGENT,
            "sliderRect": {"x": BUTTON.x, "y": BUTTON.y, "width": BUTTON.width,
                           "height": BUTTON.height, "top": BUTTON.top, "bottom": BUTTON.bottom,
                           "left": BUTTON.left, "right": BUTTON.right},
        },
        list(INIT_COMMANDS),
        [{"command": command} for command in DRAG_COMMANDS],
        track=None,
    )

    request = build_slide_request(
        SlideRequestInput(
            appkey=app_key, token=token, secdata=secdata,
            fy_token=fy.fy, umid_token=fy.umid_token, rand_value=fy.nonce,
            button=BUTTON, track=TRACK, et_ready=True,
            ppt_ms=solved.elapsed_ms, timestamp_ms=int(time.time() * 1000),
        )
    )
    url = f"https://{host}{path}/_____tmd_____/slide?{request.to_query_string()}"

    result: dict[str, Any] = {
        "action": config.get("action"),
        "fy_length": len(fy.fy), "nonce_length": len(fy.nonce), "et_length": len(et),
        "pow_length": len(solved.signature), "pp_length": len(sign),
        "slidedata_length": len(request.slidedata),
    }
    if dry_run:
        result["url_length"] = len(url)
        return result

    response = session.get(url, timeout=20, headers={
        "bx-pp": sign, "bx-et": et, "referer": challenge["url"],
    })
    try:
        body = response.json()
    except ValueError:
        body = {"raw": response.text[:200]}
    result.update({
        "status": response.status_code,
        "code": (body.get("result") or {}).get("code"),
        "x5sec": bool(response.headers.get("bx-x5sec")),
        "body": body,
    })
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="完全离线的 x5sec 滑块请求")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--trials", type=int, default=1)
    parser.add_argument("--distance", type=float, default=316.0)
    parser.add_argument("--templates", type=Path,
                        default=Path(__file__).resolve().parents[2] / ".playwright-cli" / "human_traj.json")
    parser.add_argument("--dry-run", action="store_true", help="只组装，不发送")
    arguments = parser.parse_args()

    templates = load_templates(str(arguments.templates)) if arguments.templates.exists() else []
    results = []
    for index in range(arguments.trials):
        seed = arguments.seed + index
        try:
            outcome = attempt(seed, templates, arguments.distance, arguments.dry_run)
        except Exception as error:  # noqa: BLE001
            outcome = {"seed": seed, "error": f"{type(error).__name__}: {error}"[:300]}
        outcome["seed"] = seed
        results.append(outcome)
        print(json.dumps(outcome, ensure_ascii=False), flush=True)

    if not arguments.dry_run:
        passed = sum(1 for item in results if item.get("code") == 0)
        print(json.dumps({"trials": len(results), "pass": passed}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
