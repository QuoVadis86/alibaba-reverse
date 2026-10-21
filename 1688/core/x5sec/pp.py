from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any, Mapping, Sequence


_RUNNER = Path(__file__).with_name("runtime") / "pp_vm_runtime.cjs"


def generate_pp_sign(
    page: Mapping[str, Any],
    init_commands: Sequence[str],
    drag_calls: Sequence[Mapping[str, Any]],
    *,
    track: str | None = None,
) -> str:
    payload = {
        "page": dict(page),
        "initCommands": list(init_commands),
        "dragCalls": list(drag_calls),
        "track": track,
    }
    result = subprocess.run(
        ["node", str(_RUNNER)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(f"处罚页 VM 执行失败: {result.stderr.strip()[:500]}")
    output = json.loads(result.stdout)
    signature = output.get("ppSign")
    if not isinstance(signature, str) or not signature:
        raise ValueError("处罚页 VM 未生成 ppSign")
    return signature
