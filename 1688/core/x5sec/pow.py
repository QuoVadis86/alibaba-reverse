from __future__ import annotations

import hashlib
import secrets
import string
import time
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PowDetail:
    l: int
    i: int
    q: str
    t: str
    f: str
    k: str
    enc: str
    mt: int = 3000


@dataclass(frozen=True, slots=True)
class PowResult:
    signature: str
    elapsed_ms: int
    attempts: int
    nonce: str


def solve_pow(
    detail: PowDetail,
    *,
    nonce: str | None = None,
    first_marker: str = "1",
    second_marker: str = "1",
    third_marker: str = "",
) -> PowResult:
    if detail.l < 0 or detail.i < 0 or detail.mt < 0:
        raise ValueError("PoW 难度、偏移与超时不能为负数")
    if detail.l > 0 and (not detail.q or detail.i + detail.l > 32):
        raise ValueError("PoW 目标超出 MD5 摘要范围")
    if nonce is not None and (
        len(nonce) != 16 or any(char not in string.ascii_letters for char in nonce)
    ):
        raise ValueError("nonce 必须为 16 个英文字母")

    started = time.monotonic_ns()
    attempts = 0
    target = detail.q[:1] * detail.l
    candidate = nonce if nonce is not None else "".join(
        secrets.choice(string.ascii_letters) for _ in range(16)
    )
    while True:
        base = (
            f"{detail.l}|{detail.i}|{detail.q}|{detail.t}|{detail.f}|{detail.k}|"
            f"{first_marker}|{second_marker}|{third_marker}|{candidate}|{attempts}"
        )
        digest = hashlib.md5(base.encode("utf-8")).hexdigest()
        if digest[detail.i : detail.i + detail.l] == target:
            elapsed_ms = (time.monotonic_ns() - started) // 1_000_000
            plain = f"xb:{digest}:{base}:{candidate}:{attempts}:{detail.enc}:{elapsed_ms}"
            return PowResult(plain.encode("utf-8").hex(), elapsed_ms, attempts, candidate)
        attempts += 1
        if attempts % 100 == 0 and (time.monotonic_ns() - started) // 1_000_000 > detail.mt:
            raise TimeoutError("PoW 求解超过 mt 毫秒")
