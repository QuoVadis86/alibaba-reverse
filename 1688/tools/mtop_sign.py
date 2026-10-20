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
    """MTOP 签名所需的原始字符串参数；无令牌时传入 None。"""

    token: Token | None
    timestamp_ms: TimestampMs
    app_key: AppKey
    data: RequestData


def compute_sign(inputs: MtopSignInput) -> str:
    """按 MTOP 的 JavaScript 字符串规则返回小写十六进制 MD5 签名。

    JavaScript 将 undefined 拼入字符串时会得到字面文本 ``undefined``；
    因此无 token 的引导请求不能省略 token，也不能把它当成空字符串。
    """
    token_text = "undefined" if inputs.token is None else inputs.token
    signing_text = (
        f"{token_text}&{inputs.timestamp_ms}&{inputs.app_key}&{inputs.data}"
    )
    return hashlib.md5(
        signing_text.encode("utf-8"), usedforsecurity=False
    ).hexdigest()
