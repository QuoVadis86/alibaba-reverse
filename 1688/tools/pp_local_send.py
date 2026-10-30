"""x5sec 本地参数计算与本地发送。

浏览器只负责采集拖拽事件；`bx-pp` 由本地归档 VM 计算，验证请求由本地 Node 发出。
实现在同目录的 `pp_local_send.cjs`，本文件负责环境准备与结果解析。

用法：

    uv run --project 1688 python 1688/tools/pp_local_send.py --new
    uv run --project 1688 python 1688/tools/pp_local_send.py --challenge .playwright-cli/challenge_live_captcha.json
    uv run --project 1688 python 1688/tools/pp_local_send.py --self-test .playwright-cli/pp_vm_capture_captchacapslidev2.json
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

_TOOLS = Path(__file__).resolve().parent
_RUNNER = _TOOLS / "pp_local_send.cjs"
_DEFAULT_CHALLENGE = Path(__file__).resolve().parents[2] / ".playwright-cli" / "challenge_live_captcha.json"


def _node_path() -> str:
    """返回全局 node_modules，供 `require('playwright')` 使用。"""
    root = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True, check=False)
    if root.returncode == 0 and root.stdout.strip():
        return root.stdout.strip()
    raise RuntimeError("无法定位全局 node_modules（npm root -g 失败）")


def _run(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    environment = dict(os.environ)
    environment["NODE_PATH"] = _node_path()
    return subprocess.run(
        ["node", str(_RUNNER), *arguments],
        capture_output=True,
        text=True,
        env=environment,
        check=False,
    )


def _new_challenge() -> Path:
    from tools.get_challenge import OUTPUT_DIR, request_challenge

    for _ in range(12):
        result = request_challenge()
        if not result.get("url"):
            continue
        path = OUTPUT_DIR / "challenge_live_captcha.json"
        path.write_text(json.dumps(result, ensure_ascii=False))
        path.chmod(0o600)
        return path
    raise RuntimeError("连续请求均未取得挑战链接")


def _summary(payload: dict[str, Any]) -> dict[str, Any]:
    outcome = payload.get("outcome") or {}
    return {
        "action": payload.get("action"),
        "mode": outcome.get("mode"),
        "sentBy": outcome.get("sentBy"),
        "localLength": outcome.get("localLength"),
        "browserLength": outcome.get("browserLength"),
        "equal": outcome.get("equal"),
        "code": outcome.get("code"),
        "status": outcome.get("status"),
        "error": outcome.get("error"),
        "finalUrl": payload.get("finalUrl"),
        "vmSha256": (payload.get("version") or {}).get("vmSha256", "")[:16],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="本地计算 x5sec 参数并由本地发送验证请求")
    parser.add_argument("--challenge", type=Path, help="挑战 JSON 路径")
    parser.add_argument("--new", action="store_true", help="先取一个新挑战")
    parser.add_argument("--mode", choices=("local", "browser"), default="local",
                        help="local=本地发送；browser=浏览器发送（对照组）")
    parser.add_argument("--out", type=Path, help="结果 JSON 输出路径")
    parser.add_argument("--headless", action="store_true", help="无头运行（人工拖动会不可用）")
    parser.add_argument("--self-test", type=Path, help="离线自检：不启动浏览器、不联网")
    arguments = parser.parse_args()

    if arguments.self_test:
        result = _run(["--self-test", str(arguments.self_test)])
        sys.stdout.write(result.stdout)
        sys.stderr.write(result.stderr)
        return result.returncode

    challenge = arguments.challenge
    if arguments.new or challenge is None:
        challenge = _new_challenge()
    if not challenge.exists():
        raise SystemExit(f"挑战文件不存在: {challenge}")

    out = arguments.out or Path("/tmp/pp_local_send_result.json")
    command = ["--challenge", str(challenge), "--mode", arguments.mode, "--out", str(out)]
    if arguments.headless:
        command.append("--headless")
    result = _run(command)
    sys.stderr.write(result.stderr)
    sys.stderr.write(result.stdout)
    if not out.exists():
        sys.stdout.write(result.stdout)
        return result.returncode or 1
    payload = json.loads(out.read_text())
    print(json.dumps(_summary(payload), ensure_ascii=False, indent=1))
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
