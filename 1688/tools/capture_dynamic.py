from __future__ import annotations

import argparse
import base64
import gzip
import json
import os
import re
import signal
import struct
import subprocess
import time
from pathlib import Path
from typing import Any

from get_challenge import OUTPUT_DIR, get_challenge


_PLAYWRIGHT = Path.home() / ".codex/skills/playwright/scripts/playwright_cli.sh"
_SCRIPT = Path(__file__).with_name("dynamic_capture.js")
_RUNTIME = Path(__file__).resolve().parents[1] / "core/x5sec/runtime/js_runtime.cjs"
_PROBES = Path(__file__).with_name("probes")
_ET_PC_PROBE = _PROBES / "et_pc_probe.txt"
_ET_W_PROBE = _PROBES / "et_w_probe.txt"
_ENVIRONMENT_PROBE = _PROBES / "environment_snapshot.js"
_NONCE_LT_PROBE = _PROBES / "nonce_lt_probe.txt"
_NONCE_MT_PROBE = _PROBES / "nonce_mt_probe.txt"
_NONCE_TT_PROBE = _PROBES / "nonce_tt_probe.txt"
_NONCE_DISPATCH_PROBE = _PROBES / "nonce_dispatch_probe.txt"
_NONCE_MEMORY_PROBE = _PROBES / "nonce_memory_probe.txt"
_NONCE_JN_PROBE = _PROBES / "nonce_jn_probe.txt"
_AUTO_ENVIRONMENT_KEYS = {
    "window": {"screenTop", "screenLeft", "screenX", "screenY", "innerWidth",
               "innerHeight", "outerWidth", "outerHeight", "devicePixelRatio"},
    "document": {"readyState", "referrer", "visibilityState", "hidden",
                 "currentScript", "cookie"},
    "navigator": {"userAgent", "platform", "appName", "appVersion", "vendor",
                  "language", "languages", "hardwareConcurrency", "deviceMemory",
                  "webdriver"},
    "screen": {"width", "height", "availWidth", "availHeight", "availLeft",
               "availTop", "colorDepth", "pixelDepth"},
    "performance": {"timeOrigin"},
}


def make_auto_environment(capture: dict[str, Any]) -> dict[str, Any]:
    snapshot = capture.get("nonceEnvironmentBeforeInit") or {}
    overrides = {}
    for group, keys in _AUTO_ENVIRONMENT_KEYS.items():
        for key in sorted(keys):
            path = f"{group}.{key}"
            entry = snapshot.get(path) or {}
            if "replayValue" in entry:
                overrides[path] = entry["replayValue"]
    return overrides


def _playwright(session: str, command: str, *args: str, timeout: int = 90) -> str:
    try:
        result = subprocess.run(
            [str(_PLAYWRIGHT), f"-s={session}", command, *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Playwright {command} 超时（{timeout} 秒）") from None
    if result.returncode:
        raise RuntimeError(
            f"Playwright {command} 失败: {(result.stdout + result.stderr)[-1200:]}"
        )
    return result.stdout


def _terminate_session(session: str) -> None:
    listing = subprocess.run(
        ["ps", "-axo", "pid=,ppid=,command="], capture_output=True, text=True,
        check=True,
    ).stdout
    processes: dict[int, tuple[int, str]] = {}
    for line in listing.splitlines():
        parts = line.strip().split(None, 2)
        if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
            processes[int(parts[0])] = (int(parts[1]), parts[2])
    roots = {pid for pid, (_, command) in processes.items()
             if command.endswith(f"cliDaemon.js {session}")}
    owned = set(roots)
    while True:
        children = {pid for pid, (parent, _) in processes.items() if parent in owned}
        if children <= owned:
            break
        owned |= children
    for sig in (signal.SIGTERM, signal.SIGKILL):
        for pid in sorted(owned, reverse=True):
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        if sig == signal.SIGTERM and owned:
            time.sleep(1)


def _capture_with_session(session: str, code: str) -> str:
    try:
        _playwright(session, "open", "about:blank")
        return _playwright(session, "run-code", code)
    finally:
        try:
            _playwright(session, "close", timeout=15)
        except (subprocess.TimeoutExpired, RuntimeError):
            _terminate_session(session)


def _local(payload: dict[str, Any]) -> dict[str, Any]:
    result = subprocess.run(
        ["node", str(_RUNTIME)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )
    if result.returncode:
        sanitized = re.sub(r"(?:https?:)?//\S+", "<url>", result.stderr.strip())
        lines = [line for line in sanitized.splitlines() if len(line) < 1000]
        raise RuntimeError(f"本地动态模块失败: {' | '.join(lines[:4] + lines[-4:])[:1000]}")
    return json.loads(result.stdout)


def _browser_vm_trace(capture: dict[str, Any]) -> list[int]:
    if "etScTrace" in capture:
        return capture["etScTrace"]
    compressed = base64.b64decode(capture["etScTraceGzip"], validate=True)
    raw = gzip.decompress(compressed)
    if len(raw) % 4:
        raise ValueError("ET VM 轨迹字节数异常")
    return list(struct.unpack(f"<{len(raw) // 4}I", raw))


def _browser_pc_trace(capture: dict[str, Any]) -> list[int]:
    compressed = base64.b64decode(capture["etPcTraceGzip"], validate=True)
    raw = gzip.decompress(compressed)
    if len(raw) % 4:
        raise ValueError("ET PC 轨迹字节数异常")
    return list(struct.unpack(f"<{len(raw) // 4}I", raw))


def make_et_payload(
    capture: dict[str, Any], call: dict[str, Any], *,
    replay_startup: bool = True, trace_et_pc: bool = True,
    trace_et_vm: bool = False, init_delay_ms: int = 50,
) -> dict[str, Any]:
    et_page = {**capture["page"], "etInitCookie": capture.get("etInitCookie"),
               "etInitReadyState": capture.get("etInitReadyState")}
    if trace_et_pc:
        et_page["etCallDocumentHooks"] = capture.get("etCallDocumentHooks") or {}
    if trace_et_pc:
        for item in capture.get("etInitPcMetadata") or capture.get("etPcMetadata") or []:
            if item.get("kind") == "document":
                et_page["etWindowNameCount"] = item["windowCount"]
                et_page["etInitDivCount"] = item["divCount"]
            elif item.get("kind") == "performance":
                et_page["etResourceCount"] = item["count"]
                et_page["etResourceEntries"] = item.get("entries", [])
        for item in capture.get("etPcMetadata") or []:
            if item.get("kind") == "document":
                et_page["etCallWindowNameCount"] = item["windowCount"]
                et_page["etCallDivCount"] = item["divCount"]
            elif item.get("kind") == "performance":
                et_page["etCallResourceCount"] = item["count"]
                et_page["etCallResourceEntries"] = item.get("entries", [])
    payload = {"mode": "et", "page": et_page, "url": call["args"][0],
               "events": capture["events"][:call["eventIndex"]],
               "randomTape": call["randomTape"], "timeTape": call["timeTape"],
               "charAtValue": call.get("charAtValue")}
    fingerprint = capture.get("etStartupFingerprint") or []
    if len(fingerprint) > 92 and isinstance(fingerprint[92], int):
        payload["initTimestamp"] = fingerprint[92]
        payload["captureFingerprint"] = True
    if trace_et_pc and len(fingerprint) > 92:
        metadata = {item["kind"]: item for item in capture.get("etInitPcMetadata") or []}
        seed = metadata.get("seedSource") or {}
        elapsed = metadata.get("elapsed") or {}
        if isinstance(seed.get("me"), int) and isinstance(elapsed.get("milliseconds"), int):
            date_tape = [fingerprint[92]] * 22
            date_tape[7] = seed["me"]
            date_tape[9] = fingerprint[92] + elapsed["milliseconds"]
            date_tape[12] = fingerprint[57] * 1000
            payload["initDateTape"] = date_tape
        canvas_values = [item["value"] for item in capture.get("environment", {}).get("canvas", [])
                         if item.get("method") == "toDataURL" and isinstance(item.get("value"), str)]
        if canvas_values:
            payload["canvasData"] = max(canvas_values, key=len)
        call_metadata = {item["kind"]: item for item in capture.get("etPcMetadata") or []}
        call_seed = call_metadata.get("seedSource") or {}
        if isinstance(call_seed.get("me"), int):
            payload["callTimestamp"] = call_seed["me"]
        if call.get("callDateTape"):
            payload["callDateTape"] = call["callDateTape"]
        payload["tracePc"] = True
    if trace_et_vm:
        payload["traceVm"] = True
    if trace_et_pc:
        resource_calls = capture.get("etM12Inputs") or []
        if resource_calls and isinstance(resource_calls[0].get("h"), str):
            payload["replayResourceOrigin"] = resource_calls[0]["h"]
        prior_calls = []
        for item in capture.get("etM14Inputs") or []:
            if item.get("p") == 1:
                break
            if type(item.get("v")) is int and item["v"] == 1:
                prior_calls.append({"url": "", "v": 1})
        payload["etWarmupM14Requests"] = prior_calls
        payload["replayMessageEvent"] = True
        payload["etCallStackMode"] = "playwright"
        call_fingerprint = capture.get("etCallFingerprint") or []
        if len(call_fingerprint) > 21 and type(call_fingerprint[21]) is int:
            # W[21] can change between ET initialization and a human drag.
            payload["callFingerprintOverrides"] = {"21": call_fingerprint[21]}
    if replay_startup:
        startup = capture.get("environment", {}).get("startup") or {}
        payload["initRandomTape"] = [entry["value"] for entry in startup.get("random", [])
                                     if "et_f.js" in str(entry.get("stack", []))]
        payload["initTimeTape"] = [entry["value"] for entry in startup.get("time", [])
                                   if "et_f.js" in str(entry.get("stack", []))]
        payload["initDelayMs"] = init_delay_ms
    return payload


def make_nonce_payload(
    capture: dict[str, Any], call: dict[str, Any], *, trace_gt: bool = False,
    replay_digest: bool = False, auto_env: bool = False,
) -> dict[str, Any]:
    startup = capture.get("environment", {}).get("startup") or {}
    webgl_calls = capture.get("environment", {}).get("webgl") or []
    webgl_params = {str(item["args"][0]): item.get("value") for item in webgl_calls
                    if item.get("method") == "getParameter" and item.get("args")}
    payload = {"mode": "nonce_only", "page": capture["page"],
               "fy": call["args"][0], "phase": call["args"][1],
               "events": capture["events"][:call["eventIndex"]],
               "randomTape": call["randomTape"], "timeTape": call["timeTape"],
               "webglProfile": {"ext": capture["page"].get("webglExtensions") or [],
                                "params": webgl_params},
               "nonceResourceSnapshots": [item.get("resources") or [] for item in
                                          (capture.get("nonceEarlyCalls") or [])[:3]],
               "nonceInitDelayMs": 450,
               "nonceWorkerInput": capture.get("nonceWorkerInput"),
               "nonceWorkerEvents": capture.get("nonceWorkerEvents") or [],
               "nonceImageLoads": capture.get("nonceImageLoads") or [],
               "nonceCanvasDataTape": [entry["value"] for entry in
                                       capture.get("environment", {}).get("canvas", [])
                                       if entry.get("method") == "toDataURL" and
                                       "eval at t" in str(entry.get("stack", [])) and
                                       isinstance(entry.get("value"), str)],
               "nonceIceEvents": capture.get("nonceIceEvents") or [],
               "nonceInitRandomTape": capture.get("nonceRandomAll") or
                                      [entry["value"] for entry in startup.get("random", [])
                                       if "eval at t" in str(entry.get("stack", []))],
               "nonceInitTimeTape": [entry["value"] for entry in startup.get("time", [])
                                       if "eval at t" in str(entry.get("stack", []))]}
    state = capture.get("nonceStateBeforeAsset") or capture.get("nonceStateBeforeInit") or {}
    payload["nonceConfig"] = state.get("config")
    payload["nonceLocalStorage"] = state.get("localStorage")
    payload["nonceSessionStorage"] = state.get("sessionStorage")
    payload["noncePrototypeKeys"] = state.get("prototypeKeys")
    payload["nonceWindowKeys"] = state.get("windowKeys")
    payload["nonceWindowNames"] = (capture.get("nonceStateBeforeInit") or {}).get(
        "windowNames") or state.get("windowNames")
    all_dom_reads = [*(capture.get("nonceLtTrace") or []),
                     *((capture.get("nonceTargetTrace") or {}).get("__nonceLtTrace") or [])]
    payload["nonceDomElementCounts"] = [entry["value"]["length"] for entry in
                                        all_dom_reads
                                        if entry.get("key") == "*" and
                                        entry.get("value", {}).get("tag") ==
                                        "[object NodeList]"]
    dom_ids: dict[str, list[str | None]] = {}
    for entry in capture.get("nonceLtTrace") or []:
        if entry.get("opcode") != 49 or not isinstance(entry.get("key"), str):
            continue
        shape = entry.get("value") or {}
        dom_ids.setdefault(entry["key"], []).append(shape.get("tag"))
    payload["nonceDomIds"] = dom_ids
    payload["nonceErrorStacks"] = [entry["content"] for entry in
                                   capture.get("nonceMtTrace") or []
                                   if isinstance(entry.get("content"), str) and
                                   entry["content"].startswith("Error\n")]
    payload["nonceErrorStacks"].extend(
        entry["content"] for entry in
        (capture.get("nonceTargetTrace") or {}).get("__nonceMtTrace") or []
        if isinstance(entry.get("content"), str) and
        entry["content"].startswith("Error\n")
    )
    payload["nonceTimerStart"] = next((entry["result"]["value"] for entry in
                                       capture.get("nonceDispatchTrace") or []
                                       if entry.get("kind") == "qt" and
                                       entry.get("n") == 15 and
                                       entry.get("result", {}).get("type") ==
                                       "number"), None)
    payload["nonceRtcOffer"] = next((entry["key"] for entry in
                                     capture.get("nonceLtTrace") or []
                                     if entry.get("parent") == "[object RTCPeerConnection]"
                                     and isinstance(entry.get("key"), dict)
                                     and "sdp" in entry["key"]), None)
    window_count = (capture.get("nonceEnvironmentBeforeInit") or {}).get(
        "window.ownPropertyCount", {}).get("value")
    if isinstance(window_count, int):
        payload["nonceWindowNameCount"] = window_count
    document_keys = (capture.get("nonceEnvironmentBeforeInit") or {}).get(
        "window.document", {}).get("value", {}).get("ownKeys", [])
    payload["nonceDocumentHooks"] = [key for key in
                                     ("__update_info", "__update_pos")
                                     if key in document_keys]
    early_calls = capture.get("nonceEarlyCalls") or []
    payload["nonceWindowNamesByPhase"] = {
        str(item["args"][1]): item["windowNames"] for item in early_calls
        if len(item.get("args") or []) > 1 and
        isinstance(item.get("windowNames"), list)
    }
    payload["nonceInitialWindowPresence"] = {
        item["key"]: item["present"] for item in capture.get("nonceJnTrace") or []
        if item.get("phase") == 0 and item.get("parent") == "[object Window]"
        and isinstance(item.get("key"), str)
    }
    payload["nonceWindowPresenceByPhase"] = {
        str(phase): {item["key"]: item["present"] for item in
                     capture.get("nonceJnTrace") or []
                     if item.get("phase") == phase and
                     item.get("parent") == "[object Window]" and
                     isinstance(item.get("key"), str)}
        for phase in (0, 1, 3, 4)
    }
    payload["nonceWindowKeysByPhase"] = {
        str(item["args"][1]): item["windowKeys"] for item in early_calls
        if len(item.get("args") or []) > 1 and
        isinstance(item.get("windowKeys"), list)
    }
    worker_counts: dict[str, int] = {}
    for item in early_calls:
        phase = str(item["args"][1])
        if isinstance(item.get("workerEventCount"), int):
            worker_counts[phase] = item["workerEventCount"]
            continue
        memory = item.get("memoryBefore") or {}
        start = memory.get("sampleStart", -1)
        sample = memory.get("sample") or []
        if start <= 9076 and start + len(sample) >= 9080:
            count = int.from_bytes(bytes(sample[9076 - start:9080 - start]), "little")
            worker_counts[phase] = count + 1 if count else 0
    payload["nonceWorkerCountsByPhase"] = worker_counts
    # Worker 消息在首次非初始化调用之前已进入浏览器事件循环。
    first_phase = str(early_calls[1]["args"][1]) if len(early_calls) > 1 else None
    if first_phase in worker_counts:
        payload["noncePrePhaseWorkerCount"] = worker_counts[first_phase]
    animation_snapshot = next((item["memoryBefore"] for item in early_calls[1:]
                               if item.get("memoryBefore") and
                               item["memoryBefore"]["sampleStart"] <= 8812 and
                               item["memoryBefore"]["sampleStart"] +
                               len(item["memoryBefore"]["sample"]) >= 8816), None)
    if animation_snapshot:
        offset = 8812 - animation_snapshot["sampleStart"]
        payload["nonceAnimationFrameTimes"] = [int.from_bytes(bytes(
            animation_snapshot["sample"][offset:offset + 4]), "little")]
    if len(early_calls) >= 3 and early_calls[-1].get("output") == call["output"]:
        payload["noncePriorCalls"] = [item["args"] for item in early_calls[1:-2]]
        payload["nonceResourceSnapshots"].append(early_calls[-2].get("resources") or [])
        target_tapes = early_calls[-2].get("tapes") or {}
        payload["nonceInitRandomTape"] += target_tapes.get("random", [])
        payload["nonceInitTimeTape"] += target_tapes.get("time", [])
    if trace_gt:
        payload["traceNonceGt"] = True
    if replay_digest:
        payload["nonceReplayDigestResults"] = [item["output"] for item in
                                                capture.get("nonceDigestTrace") or []
                                                if isinstance(item.get("output"), list)]
    if auto_env:
        payload["nonceEnvironmentOverrides"] = make_auto_environment(capture)
    return payload


def compare_capture(
    capture: dict[str, Any], *, replay_startup: bool = False,
    init_delay_ms: int = 50, trace_et_vm: bool = False,
    trace_et_pc: bool = False
) -> list[dict[str, Any]]:
    labels = [call["label"] for call in capture["calls"]]
    if labels.count("fy") != 1 or labels.count("nonce") != 1 or labels.count("et") != 1:
        raise ValueError(f"动态函数调用数量异常: {labels}")
    if len(capture["verifyRequests"]) != 1:
        raise ValueError(f"验证请求数量异常: {len(capture['verifyRequests'])}")
    browser_et = next(call["output"] for call in capture["calls"] if call["label"] == "et")
    if capture["verifyRequests"][0]["et"] != browser_et:
        raise ValueError("ET 函数输出与验证请求头不一致")
    result = []
    for call in capture["calls"]:
        label = call["label"]
        source = "et_f.js" if label == "et" else "index1.js"
        startup = capture.get("environment", {}).get("startup") or {}
        init_random = [entry["value"] for entry in startup.get("random", [])
                       if source in str(entry.get("stack", []))]
        init_time = [entry["value"] for entry in startup.get("time", [])
                     if source in str(entry.get("stack", []))]
        if label == "fy":
            payload = {"mode": "fy_nonce", "page": capture["page"],
                       "phase": 3, "record": True,
                       "events": capture["events"][:call["eventIndex"]],
                       "randomTape": call["randomTape"], "timeTape": call["timeTape"]}
            webgl_calls = capture.get("environment", {}).get("webgl") or []
            payload["webglProfile"] = {
                "ext": capture["page"].get("webglExtensions") or [],
                "params": {str(item["args"][0]): item.get("value")
                           for item in webgl_calls
                           if item.get("method") == "getParameter" and item.get("args")},
            }
            key = "fy"
        elif label == "nonce":
            payload = make_nonce_payload(capture, call)
            key = "nonce"
        elif label == "et":
            payload = make_et_payload(
                capture, call, replay_startup=replay_startup,
                trace_et_pc=trace_et_pc, trace_et_vm=trace_et_vm,
                init_delay_ms=init_delay_ms,
            )
            key = "et"
        else:
            continue
        if replay_startup and label != "et":
            payload["initRandomTape"] = init_random
            payload["initTimeTape"] = init_time
            payload["initDelayMs"] = init_delay_ms
        local_result = _local(payload)
        local = local_result[key]
        browser = call["output"]
        first_difference = next(
            (index for index, (left, right) in enumerate(zip(browser, local))
             if left != right),
            min(len(browser), len(local)) if len(browser) != len(local) else None,
        )
        result.append({"label": label, "equal": browser == local,
                       "browserLength": len(browser), "localLength": len(local),
                       "firstDifference": first_difference,
                       "initRandomAvailable": len(init_random),
                       "initRandomConsumed": local_result["initRandomConsumed"],
                       "initTimeAvailable": len(init_time),
                       "initTimeConsumed": local_result["initTimeConsumed"]})
        if label == "et" and trace_et_vm:
            browser_trace = _browser_vm_trace(capture)
            local_trace = local_result["scTrace"]
            result[-1]["browserVmSteps"] = len(browser_trace)
            result[-1]["localVmSteps"] = len(local_trace)
            result[-1]["firstVmDifference"] = next(
                (index for index, (left, right) in enumerate(zip(browser_trace, local_trace))
                 if left != right),
                min(len(browser_trace), len(local_trace))
                if len(browser_trace) != len(local_trace) else None,
            )
            browser_state = capture["etVmState"]
            local_state = local_result["vmState"]
            result[-1]["browserVmTotal"] = browser_state["count"]
            result[-1]["localVmTotal"] = local_state["count"]
            result[-1]["firstCheckpointDifference"] = next(
                (index for index, (left, right) in enumerate(zip(
                    browser_state["checkpoints"], local_state["checkpoints"]
                )) if left != right),
                min(len(browser_state["checkpoints"]), len(local_state["checkpoints"]))
                if len(browser_state["checkpoints"]) != len(local_state["checkpoints"])
                else None,
            )
            browser_fingerprint = capture.get("etStartupFingerprint") or []
            local_fingerprint = local_result.get("startupFingerprint") or []
            result[-1]["startupFingerprintDifferences"] = [
                index for index, (left, right) in enumerate(zip(
                    browser_fingerprint, local_fingerprint
                )) if left != right
            ]
            browser_bytes = capture.get("etPayloadBytes") or []
            local_bytes = local_result.get("payloadBytes") or []
            result[-1]["browserPayloadLength"] = len(browser_bytes)
            result[-1]["localPayloadLength"] = len(local_bytes)
            result[-1]["firstPayloadDifference"] = next(
                (index for index, (left, right) in enumerate(zip(
                    browser_bytes, local_bytes
                )) if left != right),
                min(len(browser_bytes), len(local_bytes))
                if len(browser_bytes) != len(local_bytes) else None,
            )
        if label == "et" and trace_et_pc:
            browser_trace = _browser_pc_trace(capture)
            local_trace = local_result["pcTrace"]
            result[-1]["browserPcSteps"] = len(browser_trace)
            result[-1]["localPcSteps"] = len(local_trace)
            result[-1]["firstPcDifference"] = next(
                (index for index, (left, right) in enumerate(zip(browser_trace, local_trace))
                 if left != right),
                min(len(browser_trace), len(local_trace))
                if len(browser_trace) != len(local_trace) else None,
            )
            browser_fingerprint = capture.get("etStartupFingerprint") or []
            local_fingerprint = local_result.get("startupFingerprint") or []
            result[-1]["startupFingerprintDifferences"] = [
                index for index, (left, right) in enumerate(zip(
                    browser_fingerprint, local_fingerprint
                )) if left != right
            ]
            browser_metadata = {item["kind"]: item for item in capture.get("etPcMetadata") or []}
            local_metadata = {item["kind"]: item for item in local_result.get("pcMetadata") or []}
            result[-1]["metadataDifferences"] = [kind for kind in browser_metadata
                if browser_metadata[kind] != local_metadata.get(kind)]
            browser_environment = capture.get("etEnvironmentSnapshot") or {}
            local_environment = local_result.get("environmentSnapshot") or {}
            environment_paths = sorted(set(browser_environment) | set(local_environment))
            result[-1]["environmentDifferences"] = [name for name in environment_paths
                if browser_environment.get(name) != local_environment.get(name)]
            browser_bytes = (browser_metadata.get("payload") or {}).get("bytes") or []
            local_bytes = (local_metadata.get("payload") or {}).get("bytes") or []
            result[-1]["firstPayloadDifference"] = next(
                (index for index, (left, right) in enumerate(zip(browser_bytes, local_bytes))
                 if left != right),
                min(len(browser_bytes), len(local_bytes))
                if len(browser_bytes) != len(local_bytes) else None,
            )
    return result


def build_capture_code(
    challenge: dict[str, Any], *, startup_trace: bool = False,
    break_et: bool = False, trace_et_vm: bool = False,
    trace_et_pc: bool = False, trace_nonce_gt: bool = False,
    probe_fy: bool = False, trace_fy_branch: bool = False,
    save_et_source: bool = False, manual_drag: bool = False,
    intercept_verify: bool = False,
) -> str:
    return _SCRIPT.read_text().replace(
        "CHALLENGE_PAYLOAD", json.dumps(challenge, ensure_ascii=False)
    ).replace("MANUAL_DRAG_PAYLOAD", json.dumps(manual_drag)).replace(
        "INTERCEPT_VERIFY_PAYLOAD", json.dumps(intercept_verify)).replace(
        "STARTUP_TRACE", json.dumps(startup_trace)
    ).replace("BREAK_ET", json.dumps(break_et)
    ).replace("TRACE_ET_VM", json.dumps(trace_et_vm)).replace(
        "TRACE_ET_PC_PAYLOAD", json.dumps(trace_et_pc)).replace(
        "TRACE_NONCE_GT_PAYLOAD", json.dumps(trace_nonce_gt)).replace(
        "PROBE_FY_PAYLOAD", json.dumps(probe_fy)).replace(
        "TRACE_FY_BRANCH_PAYLOAD", json.dumps(trace_fy_branch)).replace(
        "ET_PC_PROBE_PAYLOAD", json.dumps(_ET_PC_PROBE.read_text().strip())).replace(
        "ET_W_PROBE_PAYLOAD", json.dumps(_ET_W_PROBE.read_text().strip())).replace(
        "ENVIRONMENT_PROBE_PAYLOAD", json.dumps(_ENVIRONMENT_PROBE.read_text())).replace(
        "NONCE_LT_PROBE_PAYLOAD", json.dumps(_NONCE_LT_PROBE.read_text().strip())).replace(
        "NONCE_MT_PROBE_PAYLOAD", json.dumps(_NONCE_MT_PROBE.read_text().strip())).replace(
        "NONCE_TT_PROBE_PAYLOAD", json.dumps(_NONCE_TT_PROBE.read_text().strip())).replace(
        "NONCE_DISPATCH_PROBE_PAYLOAD", json.dumps(_NONCE_DISPATCH_PROBE.read_text().strip())).replace(
        "NONCE_MEMORY_PROBE_PAYLOAD", json.dumps(_NONCE_MEMORY_PROBE.read_text().strip())).replace(
        "NONCE_JN_PROBE_PAYLOAD", json.dumps(_NONCE_JN_PROBE.read_text().strip())).replace(
        "SAVE_ET_SOURCE_PAYLOAD", json.dumps(save_et_source))


def main() -> None:
    parser = argparse.ArgumentParser(description="采集并对照 FY、nonce、ET")
    parser.add_argument("link_type", choices=("captchacapslidev2",))
    parser.add_argument("--startup-trace", action="store_true")
    parser.add_argument("--break-et", action="store_true")
    parser.add_argument("--trace-et-vm", action="store_true")
    parser.add_argument("--trace-et-pc", action="store_true")
    parser.add_argument("--trace-nonce-gt", action="store_true")
    parser.add_argument("--probe-fy", action="store_true")
    parser.add_argument("--trace-fy-branch", action="store_true")
    parser.add_argument("--save-et-source", action="store_true")
    parser.add_argument("--capture-output", type=Path)
    parser.add_argument("--capture-only", action="store_true")
    args = parser.parse_args()
    if args.trace_fy_branch and not args.probe_fy:
        parser.error("--trace-fy-branch 需要同时指定 --probe-fy")
    challenge = get_challenge(args.link_type)
    session = f"dynamic_{os.getpid()}"
    code = build_capture_code(
        challenge, startup_trace=args.startup_trace, break_et=args.break_et,
        trace_et_vm=args.trace_et_vm, trace_et_pc=args.trace_et_pc,
        trace_nonce_gt=args.trace_nonce_gt, probe_fy=args.probe_fy,
        trace_fy_branch=args.trace_fy_branch, save_et_source=args.save_et_source,
    )
    output = _capture_with_session(session, code)
    payload = output.split("### Result\n", 1)[1].split("\n\n", 1)[0]
    packed, _ = json.JSONDecoder().raw_decode(payload)
    capture = json.loads(gzip.decompress(base64.b64decode(packed["gzip"], validate=True)))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    et_source = capture.pop("etSourceBody", None)
    if args.save_et_source:
        if not isinstance(et_source, str) or not et_source:
            raise ValueError("未采集到 ET 脚本")
        source_path = OUTPUT_DIR / f"et_f_{args.link_type}_current.js"
        source_path.write_text(et_source, encoding="utf-8")
        source_path.chmod(0o600)
    suffix = "_startup" if args.startup_trace else ""
    if args.break_et:
        suffix += "_et_break"
    if args.trace_et_vm:
        suffix += "_et_vm"
    if args.trace_et_pc:
        suffix += "_et_pc"
    if args.trace_nonce_gt:
        suffix += "_nonce_gt"
    path = args.capture_output or OUTPUT_DIR / f"dynamic_capture_{args.link_type}{suffix}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
        json.dump(capture, handle, ensure_ascii=False)
    path.chmod(0o600)
    if args.break_et and not capture["etBreakpoints"]:
        raise ValueError("ET 函数断点未命中")
    print(json.dumps({"capture": str(path), "comparison": None if args.capture_only else compare_capture(
        capture, replay_startup=args.startup_trace,
        trace_et_vm=args.trace_et_vm, trace_et_pc=args.trace_et_pc),
                      "etBreakpoints": len(capture["etBreakpoints"])},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
