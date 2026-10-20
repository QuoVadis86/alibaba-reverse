"""为 1688 MTOP 请求计算兼容性签名；本模块不执行网络请求。"""

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
    """MTOP 签名所需的原始字符串参数。"""

    token: Token
    timestamp_ms: TimestampMs
    app_key: AppKey
    data: RequestData


def compute_sign(inputs: MtopSignInput) -> str:
    """按 MTOP 兼容格式返回小写十六进制 MD5 签名。"""
    signing_text = (
        f"{inputs.token}&{inputs.timestamp_ms}&{inputs.app_key}&{inputs.data}"
    )
    return hashlib.md5(
        signing_text.encode("utf-8"), usedforsecurity=False
    ).hexdigest()
