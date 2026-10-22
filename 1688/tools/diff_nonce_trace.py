from __future__ import annotations

import argparse
import difflib
import json
import re
from pathlib import Path
from typing import Any

from capture_dynamic import _local, make_nonce_payload


def first_difference(browser: list[Any] | str, local: list[Any] | str) -> int | None:
    for index, (left, right) in enumerate(zip(browser, local)):
        if left != right:
            return index
    return min(len(browser), len(local)) if len(browser) != len(local) else None


def registration_callsite(item: dict[str, Any]) -> str:
    stack = item.get("stack") or []
    if not stack:
        return ""
    match = re.search(r"at ([^ (]+).*?<anonymous>:1:(\d+)", stack[-1])
    return f"{match.group(1)}:{match.group(2)}" if match else stack[-1]


def main() -> None:
    parser = argparse.ArgumentParser(description="对照浏览器和本地 nonce VM 调用轨迹")
    parser.add_argument("capture", type=Path)
    parser.add_argument("--limit", type=int, default=12)
    parser.add_argument("--summary", action="store_true")
    parser.add_argument("--replay-digest", action="store_true")
    parser.add_argument("--auto-env", action=argparse.BooleanOptionalAction, default=True)
    args = parser.parse_args()
    capture = json.loads(args.capture.read_text(encoding="utf-8"))
    browser_trace = capture.get("nonceGtTrace") or []
    if not browser_trace:
        raise ValueError("采集文件没有 nonce Gt 轨迹；请用 --trace-nonce-gt 重新采集")
    calls = [item for item in capture["calls"] if item["label"] == "nonce"]
    if len(calls) != 1:
        raise ValueError(f"预期一次 nonce 调用，实际 {len(calls)} 次")
    local = _local(make_nonce_payload(capture, calls[0], trace_gt=True,
                                      replay_digest=args.replay_digest,
                                      auto_env=args.auto_env))
    local_trace = local.get("nonceGtTrace") or []
    index = first_difference(browser_trace, local_trace)
    opcode_index = first_difference([item["n"] for item in browser_trace],
                                    [item["n"] for item in local_trace])
    browser_registrations = capture.get("nonceRegistrationTrace") or []
    local_registrations = local.get("nonceRegistrationTrace") or []
    alignments = difflib.SequenceMatcher(
        None,
        [registration_callsite(item) for item in browser_registrations],
        [registration_callsite(item) for item in local_registrations],
        autojunk=False,
    ).get_opcodes()
    first_alignment = next((entry for entry in alignments if entry[0] != "equal"), None)
    browser_environment = capture.get("nonceEnvironmentBeforeInit") or {}
    local_environment = local.get("nonceEnvironmentBeforeInit") or {}
    environment_differences = [
        {"path": path,
         "category": "value" if (browser_environment.get(path) or {}).get("value") !=
         (local_environment.get(path) or {}).get("value") else "descriptor",
         "browser": browser_environment.get(path), "local": local_environment.get(path)}
        for path in sorted(set(browser_environment) | set(local_environment))
        if browser_environment.get(path) != local_environment.get(path)
    ]
    environment_differences.sort(key=lambda item: (item["category"] != "value", item["path"]))
    value_differences = [item for item in environment_differences
                         if item["category"] == "value"]
    behavior_differences = [item for item in value_differences
                            if (item["browser"] or {}).get("error") or
                            isinstance((item["browser"] or {}).get("value"), dict) and
                            (item["browser"] or {})["value"].get("type")
                            in {"object", "function"}]
    early = capture.get("nonceEarlyCalls") or []
    browser_outputs = [item.get("output") for item in early[:4]]
    local_outputs = [local.get("nonceInitOutput"), *(local.get("noncePriorOutputs") or []),
                     local["nonce"]]
    output_differences = [
        {"phase": early[position]["args"][1],
         "firstDifference": first_difference(browser_output, local_output)}
        for position, (browser_output, local_output) in enumerate(zip(
            browser_outputs, local_outputs
        )) if isinstance(browser_output, str) and isinstance(local_output, str)
    ]
    report = {
        "browserTraceLength": len(browser_trace),
        "replayDigest": args.replay_digest,
        "autoEnvironment": args.auto_env,
        "autoEnvironmentApplied": local.get("autoEnvironmentApplied") or [],
        "localTraceLength": len(local_trace),
        "firstTraceDifference": index,
        "firstOpcodeDifference": opcode_index,
        "browserAtDifference": browser_trace[index] if index is not None
        and index < len(browser_trace) else None,
        "localAtDifference": local_trace[index] if index is not None
        and index < len(local_trace) else None,
        "browserRegistrationCount": len(browser_registrations),
        "localRegistrationCount": len(local_registrations),
        "firstRegistrationCallsiteDifference": {
            "kind": first_alignment[0],
            "browser": [{"index": item["index"], "name": item.get("name"),
                         "callsite": registration_callsite(item)}
                        for item in browser_registrations[first_alignment[1]:first_alignment[2]][:5]],
            "local": [{"index": item["index"], "name": item.get("name"),
                       "callsite": registration_callsite(item)}
                      for item in local_registrations[first_alignment[3]:first_alignment[4]][:5]],
        } if first_alignment else None,
        "browserBranchProbe": capture.get("nonceBranchProbe"),
        "localBranchProbe": local.get("nonceBranchProbe"),
        "browserYrProbe": capture.get("nonceYrProbe"),
        "localYrProbe": local.get("nonceYrProbe"),
        "browserLoopProbe": capture.get("nonceLoopProbe"),
        "localLoopProbe": local.get("nonceLoopProbe"),
        "browserLoopProbes": capture.get("nonceLoopProbes"),
        "localLoopProbes": local.get("nonceLoopProbes"),
        "browserResourceGateTrace": capture.get("nonceResourceGateTrace"),
        "localResourceGateTrace": local.get("nonceResourceGateTrace"),
        "browserWorkerMessages": capture.get("nonceWorkerMessages"),
        "localWorkerMessages": local.get("nonceWorkerMessages"),
        "browserWorkerEventCount": len(capture.get("nonceWorkerEvents") or []),
        "browserImageLoadCount": len(capture.get("nonceImageLoads") or []),
        "localImageAssignments": local.get("nonceImageAssignments"),
        "browserMrProbe": capture.get("nonceMrProbe"),
        "localMrProbe": local.get("nonceMrProbe"),
        "browserDigestTrace": capture.get("nonceDigestTrace"),
        "localDigestTrace": local.get("nonceDigestTrace"),
        "outputDifferences": output_differences,
        "nonceInitRandomConsumed": local.get("nonceInitRandomConsumed"),
        "nonceInitTimeConsumed": local.get("nonceInitTimeConsumed"),
        "noncePriorConsumption": local.get("noncePriorConsumption"),
        "environmentDifferenceCount": len(environment_differences),
        "environmentValueDifferenceCount": len(value_differences),
        "environmentBehaviorDifferenceCount": len(behavior_differences),
        "environmentDifferences": environment_differences[:args.limit]
        if args.limit else environment_differences,
    }
    if args.summary:
        keys = ("replayDigest", "autoEnvironment", "autoEnvironmentApplied",
                "browserTraceLength", "localTraceLength", "firstOpcodeDifference",
                "browserRegistrationCount", "localRegistrationCount",
                "firstRegistrationCallsiteDifference", "browserWorkerEventCount",
                "browserImageLoadCount", "browserDigestTrace", "localDigestTrace",
                "outputDifferences", "environmentDifferenceCount",
                "environmentValueDifferenceCount",
                "environmentBehaviorDifferenceCount")
        report = {key: report[key] for key in keys}
        report["firstEnvironmentPaths"] = [item["path"] for item in environment_differences[:args.limit]]
        report["firstBehaviorPaths"] = [item["path"] for item in behavior_differences[:args.limit]]
        report["browserDigestTrace"] = [
            {key: value for key, value in item.items() if key != "output"}
            for item in report["browserDigestTrace"] or []
        ]
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
