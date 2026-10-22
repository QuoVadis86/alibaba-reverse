from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from capture_dynamic import _browser_pc_trace, _local, make_et_payload


def compare_environment(capture: dict[str, Any]) -> dict[str, Any]:
    browser_snapshot = capture.get("etEnvironmentSnapshot")
    if not isinstance(browser_snapshot, dict):
        raise ValueError("采集缺少环境快照；请使用 --startup-trace --trace-et-pc 重新采集")
    call = next(item for item in capture["calls"] if item["label"] == "et")
    local = _local(make_et_payload(capture, call))
    local_snapshot = local.get("environmentSnapshot") or {}
    differences = [
        {"path": path,
         "category": "value" if (browser_snapshot.get(path) or {}).get("value") !=
         (local_snapshot.get(path) or {}).get("value") else "descriptor",
         "browser": browser_snapshot.get(path), "local": local_snapshot.get(path)}
        for path in sorted(set(browser_snapshot) | set(local_snapshot))
        if browser_snapshot.get(path) != local_snapshot.get(path)
    ]
    differences.sort(key=lambda item: (item["category"] != "value", item["path"]))
    browser_metadata = {item["kind"]: item for item in capture.get("etPcMetadata") or []}
    local_metadata = {item["kind"]: item for item in local.get("pcMetadata") or []}
    metadata_differences = [kind for kind in browser_metadata
                            if browser_metadata[kind] != local_metadata.get(kind)]
    browser_fingerprint = (browser_metadata.get("callFingerprint") or {}).get("values") or []
    local_fingerprint = (local_metadata.get("callFingerprint") or {}).get("values") or []
    call_fingerprint_differences = [
        {"index": index, "browser": browser_fingerprint[index],
         "local": local_fingerprint[index]}
        for index in range(min(len(browser_fingerprint), len(local_fingerprint)))
        if browser_fingerprint[index] != local_fingerprint[index]
    ]
    browser_trace = _browser_pc_trace(capture)
    local_trace = local["pcTrace"]
    first_pc_difference = next(
        (index for index, (left, right) in enumerate(zip(browser_trace, local_trace))
         if left != right),
        min(len(browser_trace), len(local_trace))
        if len(browser_trace) != len(local_trace) else None,
    )
    browser_steps = capture.get("etEncodeSteps") or []
    local_steps = local.get("encodeSteps") or []
    first_encode_difference = next(
        (index for index, (left, right) in enumerate(zip(browser_steps, local_steps))
         if left != right),
        min(len(browser_steps), len(local_steps))
        if len(browser_steps) != len(local_steps) else None,
    )
    return {
        "etEqual": call["output"] == local["et"],
        "firstPcDifference": first_pc_difference,
        "browserPcSteps": len(browser_trace),
        "localPcSteps": len(local_trace),
        "metadataDifferences": metadata_differences,
        "callFingerprintDifferences": call_fingerprint_differences,
        "firstEncodeDifference": first_encode_difference,
        "browserEncodeStep": browser_steps[first_encode_difference]
        if first_encode_difference is not None and first_encode_difference < len(browser_steps) else None,
        "localEncodeStep": local_steps[first_encode_difference]
        if first_encode_difference is not None and first_encode_difference < len(local_steps) else None,
        "environmentDifferences": differences,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="对照同一挑战的浏览器与本地 ET 环境")
    parser.add_argument("capture", type=Path)
    parser.add_argument("--limit", type=int, default=30,
                        help="显示差异条数，设为 0 显示全部")
    args = parser.parse_args()
    capture = json.loads(args.capture.read_text(encoding="utf-8"))
    result = compare_environment(capture)
    differences = result["environmentDifferences"]
    result["environmentDifferenceCount"] = len(differences)
    if args.limit:
        result["environmentDifferences"] = differences[:args.limit]
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
