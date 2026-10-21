from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Mapping

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.x5sec.pp import generate_pp_sign


def compare_capture(capture: Mapping[str, Any]) -> dict[str, Any]:
    if "writes" in capture:
        writes = [value for value in capture["writes"] if len(value) > 500]
        track = capture["track"]
        init_commands = capture["initCommands"]
        drag_calls = capture["dragCalls"]
    else:
        writes = [
            item["value"]
            for item in capture["order"]
            if item.get("kind") == "pp-write" and item.get("length", 0) > 500
        ]
        track = next(
            slot["value"]
            for slot in capture["pc4117Hits"][0]["slots"]
            if slot["k"] == 4
        )
        if len(track) >= 150:
            raise ValueError("断点记录的轨迹可能被截断")
        init_commands = [item["command"] for item in capture["initCalls"]]
        drag_calls = [
            {"command": item["code"], "event": item.get("event")}
            for item in capture["order"]
            if item.get("kind") == "uuid-enter"
        ]
    if len(writes) != 1:
        raise ValueError(f"预期恰好一次 VM ppSign 写入，实际 {len(writes)} 次")
    local = generate_pp_sign(capture["page"], init_commands, drag_calls, track=track)
    browser = writes[0]
    first_diff = next(
        (index for index, (left, right) in enumerate(zip(browser, local)) if left != right),
        None,
    )
    if first_diff is None and len(browser) != len(local):
        first_diff = min(len(browser), len(local))
    result = {
        "equal": browser == local,
        "browserLength": len(browser),
        "localLength": len(local),
        "firstDifference": first_diff,
        "challengeAction": capture["page"].get("action"),
        "dragCommands": [call["command"] for call in drag_calls],
    }
    if "verifyRequests" in capture:
        signatures = [item["pp"] for item in capture["verifyRequests"] if item.get("pp")]
        result["headerEqual"] = len(signatures) == 1 and signatures[0] == local
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="对比 Playwright 与本地 VM 的 ppSign")
    parser.add_argument(
        "capture",
        type=Path,
        help="Playwright 的 VM 断点采集 JSON",
    )
    args = parser.parse_args()
    result = compare_capture(json.loads(args.capture.read_text()))
    print(json.dumps(result, ensure_ascii=False))
    if not result["equal"] or result.get("headerEqual") is False:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
