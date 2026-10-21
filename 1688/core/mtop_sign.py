"""实现 MTOP 的签名算法，不执行网络请求。"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import NewType

Token = NewType("Token", str)
TimestampMs = NewType("TimestampMs", str)
AppKey = NewType("AppKey", str)
RequestData = NewType("RequestData", str)


@dataclass(frozen=True, slots=True)
class MtopSignInput:
    """MTOP 签名所需参数；无令牌时传入 None。"""

    token: Token | None
    timestamp_ms: TimestampMs
    app_key: AppKey
    data: RequestData


def compute_sign(inputs: MtopSignInput) -> str:
    """按 MTOP 的 JavaScript 字符串规则返回小写 MD5 签名。"""
    token_text = "undefined" if inputs.token is None else inputs.token
    signing_text = f"{token_text}&{inputs.timestamp_ms}&{inputs.app_key}&{inputs.data}"
    return hashlib.md5(signing_text.encode("utf-8"), usedforsecurity=False).hexdigest()
