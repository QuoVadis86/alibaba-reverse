"""一次运行完成"浏览器 vs 本地"的轨迹对比，直接输出第一处分歧。

用法：
    uv run --project 1688 python 1688/tools/fy_diff.py
    uv run --project 1688 python 1688/tools/fy_diff.py --challenge .playwright-cli/challenge_captcha.json
    uv run --project 1688 python 1688/tools/fy_diff.py --skip-browser   # 复用上次浏览器采集

流程：
1. （可选）用 get_challenge 取一个新挑战；
2. 跑浏览器探针 probe_traces.cjs，采集 DG/mr/Qz 轨迹、payload、事件、cfg；
3. 用同一挑战、同一事件、钉死时间与随机流跑本地 runtime；
4. 对比四组数据，打印第一处分歧及上下文。
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "1688"))

PROBE = ROOT / "1688" / "research" / "fy-event-path" / "probe_traces.cjs"
RUNTIME = ROOT / "1688" / "core" / "x5sec" / "runtime" / "js_runtime.cjs"
CACHE = Path("/tmp/ppprobe/traces_browser.json")


def fetch_challenge() -> dict:
    from tools.get_challenge import get_challenge
    return get_challenge("captcha")


def run_browser(challenge: dict) -> dict:
    """跑浏览器探针；如果 FY 没有真正产出 token，则视为无效运行。"""
    challenge_path = Path("/tmp/ppprobe/diff_challenge.json")
    challenge_path.write_text(json.dumps(challenge))
    env = dict(os.environ)
    env.setdefault("NODE_PATH", subprocess.run(
        ["npm", "root", "-g"], capture_output=True, text=True).stdout.strip())
    result = subprocess.run(
        ["node", str(PROBE), str(challenge_path), str(CACHE)],
        capture_output=True, text=True, timeout=180, env=env,
    )
    if result.returncode != 0:
        raise RuntimeError(f"浏览器探针失败: rc={result.returncode} out={result.stdout[:300]} err={result.stderr[:300]}")
    print("[browser]", result.stdout.strip())
    data = json.loads(CACHE.read_text())
    token = (data.get("fyState") or {}).get("token")
    if isinstance(token, str) and token.startswith("234!") and len(token) > 4:
        body = token[4:]
        body += "=" * ((4 - len(body) % 4) % 4)
        try:
            data["payload"] = list(base64.b64decode(body))
        except Exception:  # noqa: BLE001
            data["payload"] = None
    if not data.get("payload"):
        raise RuntimeError("浏览器没有拿到可解码的 token")
    return data


def run_local(challenge: dict, browser: dict) -> dict:
    import requests
    from core.x5sec.dynamic import PageProfile

    cfg = browser.get("cfg") or {}
    if not cfg.get("NCTOKENSTR"):
        raise RuntimeError("浏览器没有采到 _config_")

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})
    umid_response = session.get("https://ynuf.aliapp.org/w/wu.json", timeout=15)
    umid = umid_response.text.split("__fycb('")[1].split("')")[0]

    profile = PageProfile(
        url=challenge["url"],
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        cookie="; ".join(f"{c['name']}={c['value']}" for c in challenge.get("cookies") or []),
        token=cfg["NCTOKENSTR"], app_key=cfg["NCAPPKEY"], x5secdata=cfg["SECDATA"],
        umid_token=umid,
    )

    target = {"tag": "SPAN", "id": "nc_1_n1z", "className": "nc_iconfont btn_slide",
              "rect": browser.get("rect") or {}}
    events = []
    for item in browser.get("events") or []:
        if item["type"] not in ("mousedown", "mousemove", "mouseup", "pointerdown", "pointermove", "pointerup", "focus", "focusin"):
            continue
        events.append({
            "type": item["type"],
            "x": int(item["x"] or 0), "y": int(item["y"] or 0),
            "timeStamp": int(item["ts"] or 0),
            "buttons": 1 if ("down" in item["type"] or "move" in item["type"]) else 0,
            "target": target,
        })

    payload = {
        "mode": "fy_nonce",
        "page": profile.as_runtime_input(),
        "phase": 1,
        "record": True,
        "events": events,
        "hideFyReplayFlag": True,
        "traceFy": True,
        "traceFyBranch": True,
        "pinTime": 1700000000000,
        "cryptoRandomTape": [0] * 4000,
        "randomTape": [0.25] * 4000,
    }
    result = subprocess.run(
        ["node", str(RUNTIME)], input=json.dumps(payload),
        capture_output=True, text=True, timeout=180,
    )
    if result.returncode != 0:
        raise RuntimeError(f"本地 runtime 失败: {result.stderr[:600]}")
    return json.loads(result.stdout)


def pc_of(item):
    return item[0] if isinstance(item, (list, tuple)) else item


def first_divergence(label: str, left: list, right: list) -> tuple[str, int] | None:
    n = min(len(left), len(right))
    for index in range(n):
        if pc_of(left[index]) != pc_of(right[index]):
            return (label, index)
    if len(left) != len(right):
        return (label, n)
    return None


def describe(label: str, index: int, left: list, right: list) -> str:
    window = 6
    lo = max(0, index - window)
    browser_slice = left[lo:index + window]
    local_slice = right[lo:index + window]
    browser_item = left[index] if index < len(left) else "N/A"
    local_item = right[index] if index < len(right) else "N/A"
    detail = ""
    if isinstance(browser_item, (list, tuple)) and len(browser_item) == 3:
        pc, branch, opcode = browser_item
        detail += f"\n  browser 分支={branch} opcode={opcode}"
    if isinstance(local_item, (list, tuple)) and len(local_item) == 3:
        pc, branch, opcode = local_item
        detail += f"\n  local   分支={branch} opcode={opcode}"
    return (
        f"\n=== 第一处分歧：{label} 第 {index} 步 ===\n"
        f"  browser[{lo}:{index + window}] = {browser_slice}\n"
        f"  local  [{lo}:{index + window}] = {local_slice}\n"
        f"  browser[{index}] = {browser_item}  local[{index}] = {local_item}"
        f"{detail}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="浏览器 vs 本地 FY 轨迹对比")
    parser.add_argument("--challenge", type=Path, help="已有挑战 JSON")
    parser.add_argument("--skip-browser", action="store_true", help="复用上次浏览器采集")
    arguments = parser.parse_args()

    if arguments.skip_browser and CACHE.exists():
        browser = json.loads(CACHE.read_text())
        print("[browser] 复用缓存")
        challenge = json.loads(Path("/tmp/ppprobe/diff_challenge.json").read_text())
    else:
        challenge = json.loads(arguments.challenge.read_text()) if arguments.challenge else fetch_challenge()
        if not challenge.get("url"):
            raise RuntimeError("没有取到有效挑战")
        Path("/tmp/ppprobe/diff_challenge.json").write_text(json.dumps(challenge))
        last_error = None
        for attempt in range(3):
            try:
                browser = run_browser(challenge)
                break
            except Exception as error:  # noqa: BLE001
                last_error = error
                print(f"[browser] 第 {attempt + 1} 次失败: {str(error)[:160]}")
                if attempt < 2:
                    challenge = fetch_challenge()
                    if not challenge.get("url"):
                        continue
                    Path("/tmp/ppprobe/diff_challenge.json").write_text(json.dumps(challenge))
        else:
            raise RuntimeError(f"浏览器采集连续失败: {str(last_error)[:200]}")

    local = run_local(challenge, browser)

    local_dg = [[step.get("pc"), step.get("branch"), step.get("opcode")] for step in (local.get("fyDgSteps") or [])]
    local_mr = local.get("fyMrPcs") or []
    local_qz = [[step.get("pc"), step.get("branch"), step.get("opcode")] for step in (local.get("fyQzSteps") or [])]

    comparisons = [
        ("DG", browser.get("dg") or [], local_dg),
        ("mr", browser.get("mr") or [], local_mr),
        ("Qz", browser.get("qz") or [], local_qz),
    ]

    any_divergence = False
    for label, left, right in comparisons:
        divergence = first_divergence(label, left, right)
        if divergence:
            any_divergence = True
            print(describe(label, divergence[1], left, right))
    if not any_divergence:
        print("\n三条轨迹完全一致")

    browser_payload = bytes(browser.get("payload") or [])
    local_calls = local.get("fySerializerCalls") or []
    local_payload = bytes(local_calls[-1]["resultBytes"]) if local_calls else b""
    print(
        f"\npayload: browser={len(browser_payload)} local={len(local_payload)} "
        f"diff={len(local_payload) - len(browser_payload)}"
    )
    if browser_payload and local_payload:
        n = min(len(browser_payload), len(local_payload))
        same = sum(1 for i in range(n) if browser_payload[i] == local_payload[i])
        print(f"payload 相同率: {same / n:.1%}")
    print(f"DG 步数: browser={len(browser.get('dg') or [])} local={len(local_dg)}")
    print(f"mr 步数: browser={len(browser.get('mr') or [])} local={len(local_mr)}")
    print(f"Qz 步数: browser={len(browser.get('qz') or [])} local={len(local_qz)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
