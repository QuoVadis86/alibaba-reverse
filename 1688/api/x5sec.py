from __future__ import annotations

import base64
import re
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from core.x5sec.dynamic import FyNonce, PageProfile, PointerEvent, make_fy_nonce as generate_fy_nonce, sign_et
from core.x5sec.pow import PowDetail, solve_pow
from core.x5sec.scratch_params import (
    ScratchContext,
    ScratchVerifyInput,
    build_question_query,
    build_verify_query,
)

_UMID_URL = "https://ynuf.aliapp.org/w/wu.json"
_UMID_PATTERN = re.compile(r"__fycb\('([A-Za-z0-9_-]+={0,2})'\)")


@dataclass(frozen=True, slots=True)
class PreparedRequest:
    url: str
    headers: dict[str, str]


@dataclass(frozen=True, slots=True)
class ScratchDrag:
    encrypt_token: str
    elapsed_ms: int
    drag_distance: float
    track_width: int
    max_slide_width: int
    partitioned_label: str | None = None
    cookie_disabled: bool = False
    request_v: str | None = None


def endpoint_base_from_challenge(challenge_url: str) -> str:
    parsed = urlsplit(challenge_url)
    marker = "/_____tmd_____/punish"
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or not parsed.path.endswith(marker):
        raise ValueError("不是可识别的 x5sec 处罚页地址")
    path = parsed.path.split(marker, 1)[0]
    while "//" in path:
        path = path.replace("//", "/")
    return f"{parsed.scheme}://{parsed.netloc}{path}/_____tmd_____"


def fetch_umid_token(user_agent: str, *, timeout: float = 10.0) -> str:
    request = Request(_UMID_URL, headers={"User-Agent": user_agent})
    with urlopen(request, timeout=timeout) as response:
        source = response.read().decode("utf-8")
    match = _UMID_PATTERN.search(source)
    if match is None:
        raise ValueError("UMID 响应缺少 __fycb 令牌")
    token = match.group(1)
    if len(base64.urlsafe_b64decode(token)) != 50:
        raise ValueError("UMID 令牌长度不符合实测格式")
    return token


def make_fy_nonce(
    profile: PageProfile,
    *,
    phase: Literal[1, 2, 3, 4],
    record: bool = False,
    events: tuple[PointerEvent, ...] = (),
    umid_token: str | None = None,
) -> FyNonce:
    token = umid_token or profile.umid_token or fetch_umid_token(profile.user_agent)
    return generate_fy_nonce(profile, phase=phase, record=record, events=events, umid_token=token)


def prepare_question_request(
    endpoint_base: str,
    profile: PageProfile,
    *,
    request_v: str | None = None,
) -> PreparedRequest:
    dynamic = make_fy_nonce(profile, phase=1)
    context = ScratchContext(
        profile.token,
        profile.app_key,
        profile.x5secdata,
        dynamic.fy,
        "",
    )
    query = build_question_query(context, dynamic.nonce, request_v=request_v)
    return PreparedRequest(
        f"{endpoint_base.rstrip('/')}/newslidecaptcha?{query}",
        {"User-Agent": profile.user_agent, "Cookie": profile.cookie},
    )


def prepare_verify_request(
    endpoint_base: str,
    profile: PageProfile,
    verify: ScratchDrag,
    pow_detail: PowDetail,
    *,
    events: tuple[PointerEvent, ...] = (),
    umid_token: str | None = None,
) -> PreparedRequest:
    dynamic = make_fy_nonce(
        profile, phase=3, record=True, events=events, umid_token=umid_token
    )
    pow_result = solve_pow(pow_detail)
    context = ScratchContext(
        profile.token,
        profile.app_key,
        profile.x5secdata,
        dynamic.fy,
        dynamic.umid_token,
    )
    actual_verify = ScratchVerifyInput(
        encrypt_token=verify.encrypt_token,
        elapsed_ms=verify.elapsed_ms,
        drag_distance=verify.drag_distance,
        track_width=verify.track_width,
        max_slide_width=verify.max_slide_width,
        rand_value=dynamic.nonce,
        ppt_ms=pow_result.elapsed_ms,
        partitioned_label=verify.partitioned_label,
        cookie_disabled=verify.cookie_disabled,
        request_v=verify.request_v,
    )
    query = build_verify_query(context, actual_verify)
    url = f"{endpoint_base.rstrip('/')}/newslidevalidate?{query}"
    return PreparedRequest(
        url,
        {
            "User-Agent": profile.user_agent,
            "Cookie": profile.cookie,
            "bx-et": sign_et(profile, url, events=events),
            "bx-pp": pow_result.signature,
        },
    )
