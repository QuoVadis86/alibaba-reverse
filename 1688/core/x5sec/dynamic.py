from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit


_RUNNER = Path(__file__).with_name("runtime") / "js_runtime.cjs"


@dataclass(frozen=True, slots=True)
class PageProfile:
    url: str
    user_agent: str
    cookie: str
    token: str
    app_key: str
    x5secdata: str
    referrer: str = ""
    umid_token: str = ""
    et_init_cookie: str = ""

    def as_runtime_input(self) -> dict[str, str]:
        profile = {
            "url": self.url,
            "userAgent": self.user_agent,
            "cookie": self.cookie,
            "token": self.token,
            "appKey": self.app_key,
            "x5secdata": self.x5secdata,
            "referrer": self.referrer,
            "umidToken": self.umid_token,
        }
        if self.et_init_cookie:
            profile["etInitCookie"] = self.et_init_cookie
        return profile


@dataclass(frozen=True, slots=True)
class PointerEvent:
    type: Literal["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend"]
    x: int
    y: int
    time_stamp: int
    buttons: int = 1

    def as_runtime_input(self) -> dict[str, int | str]:
        return {
            "type": self.type,
            "x": self.x,
            "y": self.y,
            "timeStamp": self.time_stamp,
            "buttons": self.buttons,
        }


@dataclass(frozen=True, slots=True)
class FyNonce:
    fy: str
    nonce: str
    umid_token: str


def make_fy_nonce(
    profile: PageProfile,
    *,
    phase: Literal[1, 2, 3, 4],
    umid_token: str,
    record: bool = False,
    events: tuple[PointerEvent, ...] = (),
) -> FyNonce:
    page_input = profile.as_runtime_input()
    page_input["umidToken"] = umid_token
    result = _run_js(
        {
            "mode": "fy_nonce",
            "page": page_input,
            "phase": phase,
            "record": record,
            "events": [event.as_runtime_input() for event in events],
        }
    )
    fy = result.get("fy")
    nonce = result.get("nonce")
    if not isinstance(fy, str) or not fy.startswith("234!"):
        raise ValueError("FY 输出无效")
    if not isinstance(nonce, str) or len(nonce) != 160:
        raise ValueError("nonce 输出无效")
    if result.get("uid") != umid_token:
        raise ValueError("FY 内部 UMID 与请求令牌不一致")
    return FyNonce(fy=fy, nonce=nonce, umid_token=umid_token)


def sign_et(
    profile: PageProfile,
    request_url: str,
    *,
    events: tuple[PointerEvent, ...] = (),
) -> str:
    parsed = urlsplit(request_url)
    if parsed.scheme in {"http", "https"} and parsed.hostname:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        request_url = request_url.replace(
            f"{parsed.scheme}://{parsed.netloc}",
            f"//{parsed.hostname}:{port}",
            1,
        )
    result = _run_js(
        {
            "mode": "et",
            "page": profile.as_runtime_input(),
            "url": request_url,
            "events": [event.as_runtime_input() for event in events],
        }
    )
    signature = result.get("et")
    if not isinstance(signature, str) or len(signature) < 100:
        raise ValueError("ET 输出无效")
    return signature


def _run_js(payload: dict[str, object]) -> dict[str, object]:
    result = subprocess.run(
        ["node", str(_RUNNER)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True,
        text=True,
        timeout=15,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"JS 模块执行失败: {result.stderr.strip()[:500]}")
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("JS 模块没有返回 JSON") from exc
    if not isinstance(value, dict):
        raise RuntimeError("JS 模块返回值不是对象")
    return value
