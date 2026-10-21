from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path

from get_challenge import OUTPUT_DIR, get_challenge
from pp_vm import generate_pp_sign


_PLAYWRIGHT = Path.home() / ".codex/skills/playwright/scripts/playwright_cli.sh"
_SCRIPT = Path(__file__).with_name("pp_vm_capture.js")


def _playwright(session: str, command: str, *args: str) -> str:
    result = subprocess.run(
        [str(_PLAYWRIGHT), f"-s={session}", command, *args],
        capture_output=True,
        text=True,
        timeout=90,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(
            f"Playwright {command} 失败: {(result.stdout + result.stderr)[-1200:]}"
        )
    return result.stdout


def main() -> None:
    parser = argparse.ArgumentParser(description="采集并本地复验处罚页 ppSign")
    parser.add_argument("link_type", choices=("captchacapslidev2",))
    args = parser.parse_args()
    challenge = get_challenge(args.link_type)
    session = f"ppvm_{os.getpid()}"
    _playwright(session, "open", "about:blank")
    code = _SCRIPT.read_text().replace(
        "CHALLENGE_PAYLOAD", json.dumps(challenge, ensure_ascii=False)
    )
    output = _playwright(session, "run-code", code)
    payload = output.split("### Result\n", 1)[1].split("\n\n", 1)[0]
    capture, _ = json.JSONDecoder().raw_decode(payload)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"pp_vm_capture_{args.link_type}.json"
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
        json.dump(capture, handle, ensure_ascii=False)
    path.chmod(0o600)
    browser_writes = [value for value in capture["writes"] if len(value) > 500]
    if len(browser_writes) != 1:
        raise ValueError(
            f"VM ppSign 写入次数异常: {len(browser_writes)}，"
            f"命令={[call['command'] for call in capture['dragCalls']]}，"
            f"原始写入长度={[len(value) for value in capture['writes']]}，采集={path}"
        )
    if not isinstance(capture.get("track"), str) or not capture["track"]:
        raise ValueError(f"VM 编码入口未记录轨迹，采集={path}")
    local = generate_pp_sign(
        capture["page"], capture["initCommands"], capture["dragCalls"],
        track=capture["track"],
    )
    sent_signatures = [item["pp"] for item in capture["verifyRequests"] if item.get("pp")]
    if len(sent_signatures) != 1:
        raise ValueError(f"验证请求头采集次数异常: {len(sent_signatures)}，采集={path}")
    print(json.dumps({
        "action": capture["page"]["action"],
        "browserLength": len(browser_writes[0]),
        "localLength": len(local),
        "equal": browser_writes[0] == local,
        "headerEqual": sent_signatures[0] == local,
        "capture": str(path),
    }, ensure_ascii=False))
    if browser_writes[0] != local or sent_signatures[0] != local:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
