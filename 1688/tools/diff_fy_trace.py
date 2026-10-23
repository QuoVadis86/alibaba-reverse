"""Compare one browser FY call with the archived local VM using the same drag events."""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from capture_dynamic import _local


OUTPUT = Path(".playwright-cli/fy_trace_current.json")
CAPTURE = Path(__file__).with_name("capture_dynamic.py")
FY_ASSET = Path(__file__).resolve().parents[1] / "core/x5sec/assets/fy-index1.js"


def source_column(stack_line: str | None) -> int | None:
    match = re.search(r"(?:index1\.js|<anonymous>):1:(\d+)", stack_line or "")
    return int(match.group(1)) if match else None


def asset_stats(source: str) -> dict[str, int]:
    state = 2166136261
    for char in source:
        state = ((state * 16777619) ^ ord(char)) & 0xFFFFFFFF
    return {"length": len(source), "hash": state}


def first_difference(browser: list[dict], local: list[dict]) -> dict | None:
    def summary(value: str | list | dict | int | None) -> dict:
        encoded = json.dumps(value, ensure_ascii=False, sort_keys=True).encode()
        return {"type": type(value).__name__, "length": len(encoded),
                "sha256": hashlib.sha256(encoded).hexdigest()[:16]}

    for index in range(max(len(browser), len(local))):
        left = browser[index] if index < len(browser) else None
        right = local[index] if index < len(local) else None
        if left is None or right is None:
            keys = ("method", "args", "found", "width", "height", "valueLength")
            return {"index": index,
                    "browser": {key: left[key] for key in keys if key in left}
                    if left else None,
                    "local": {key: right[key] for key in keys if key in right}
                    if right else None}
        keys = ("method", "args", "found", "width", "height", "valueLength")
        left_call = {key: left[key] for key in keys if key in left}
        right_call = {key: right[key] for key in keys if key in right}
        if left_call != right_call:
            return {"index": index, "browser": left_call, "local": right_call}
        if left["method"] != "getExtension" and left.get("value") != right.get("value"):
            return {"index": index, "browser": summary(left.get("value")),
                    "local": summary(right.get("value"))}
    return None


def compare_call(capture: dict, call: dict, *, prior: list[dict], record: bool,
                 serializer_replay: bool = False,
                 return_local_value: bool = False) -> dict:
    prior = [
        {
            **entry,
            "name": entry.get("name") or "getFYToken",
            "dateTape": entry.get("dateTape", entry.get("callDateTape") or []),
        }
        for entry in prior
    ]
    early_calls = capture.get("fyEarlyCalls") or []
    target_early_index = next((index for index, entry in enumerate(early_calls)
                               if entry.get("name") == "getFYToken"
                               and entry.get("output") == call.get("output")), None)
    record_early_index = (next((index for index in range(target_early_index - 1, -1, -1)
                                if early_calls[index].get("name") == "startRecord"), None)
                          if target_early_index is not None else None)
    record_prior = ([entry for entry in early_calls[record_early_index + 1:target_early_index]
                     if entry.get("name") in ("getUidToken", "getFYToken")]
                    if record and target_early_index is not None
                    and record_early_index is not None else [])
    startup = capture["environment"]["startup"]
    webgl = capture["environment"]["webgl"]
    page = capture["page"]
    initial_random = [entry for entry in startup["random"]
                      if "index1.js" in str(entry.get("stack", []))]
    browser_prior_random = sum(len(entry.get("randomTape") or []) for entry in prior
                               if entry.get("beforeHook"))
    initial_random = initial_random[:len(initial_random) - browser_prior_random]
    canvas_data = next((entry["value"] for entry in capture["environment"]["canvas"]
                        if entry.get("method") == "toDataURL"
                        and "index1.js" in str(entry.get("stack", []))
                        and isinstance(entry.get("value"), str)), None)
    xf1_steps = capture.get("fyXf1Steps") or []
    computed_style_step = xf1_steps[230] if len(xf1_steps) > 230 else {}
    initial_options_keys = next(
        ([key for key, _ in entry["aDetail"][2]]
         for entry in capture.get("fyJSteps") or []
         if isinstance(entry.get("aDetail"), list)
         and entry["aDetail"][0] == "[object Object]"
         and any(key == "MaxMTLog" for key, _ in entry["aDetail"][2])),
        list((page.get("fyOptions") or {}).keys()),
    )
    element_prototype_keys = next(
        ([key for key, _ in dict(entry["dDetail"][2])["16"][2]]
         for entry in capture.get("fyVx7Steps") or []
         if isinstance(entry.get("dDetail"), list)
         and "16" in dict(entry["dDetail"][2])),
        [],
    )
    payload = {
        "mode": "fy_nonce",
        "page": page,
        "phase": 3,
        "record": record,
        "events": capture["events"][:call["eventIndex"]] if record else [],
        "randomTape": call["randomTape"],
        "timeTape": call["timeTape"],
        "callDateTape": call.get("callDateTape") or [],
        "initRandomTape": [entry["value"] for entry in initial_random],
        "initTimeTape": [entry["value"] for entry in startup["time"]
                         if "index1.js" in str(entry.get("stack", []))],
        "initTimestamp": (((capture.get("fyDg13GateChecks") or [{}])[0]
                           .get("wProfile") or {}).get("66") or {}).get("scalar"),
        "initDateTape": [entry["value"] for entry in startup.get("dateConstruct") or []
                         if "index1.js" in str((entry.get("stack") or [None, None])[1])],
        "initDelayMs": int(os.environ.get("FY_INIT_DELAY_MS", str(
            (next((index for index, gate in enumerate(
                capture.get("fyDg13GateChecks") or []) if gate.get("w24") == 1), 4)
             + 1) * 50 + 25))),
        "traceFy": True,
        "traceFyBranch": capture.get("fyBranchTrace") is not None,
        "fyOptions": page.get("fyOptions") or {},
        "fyInitialOptions": {key: (page.get("fyOptions") or {})[key]
                             for key in initial_options_keys
                             if key in (page.get("fyOptions") or {})},
        "charAtValue": call.get("charAtValue"),
        "storageEstimate": page.get("storageEstimate"),
        "fyResourceQueries": capture.get("fyResourceQueries") or [],
        "fyResourceEntries": call.get("fyResourceEntries"),
        "fyPerformanceMemory": call.get("fyPerformanceMemory"),
        "fyMrSource": next((entry["source"] for entry in
                             capture.get("fyMrCalls") or []
                             if isinstance(entry.get("source"), str)), None),
        "fyFontProbes": [entry for entry in capture.get("fyStyleVmInputs") or []
                         if entry.get("kind") == "fontProbe"],
        "fyFeature77DateTape": [entry["now"]
                                for entry in capture.get("fyStyleVmInputs") or []
                                if entry.get("kind") == "feature77Date"],
        "fyDragStackLine": next((entry["value"] for entry in
                                 capture.get("fyStyleVmInputs") or []
                                 if entry.get("kind") == "feature52StackRead"
                                 and isinstance(entry.get("value"), str)), None)
        if record else None,
        "fyReplayDateTape": [entry["value"]
                             for entry in startup.get("dateConstruct") or []
                             if len(entry.get("stack") or []) > 2
                             and "index1.js:1:" in entry["stack"][1]
                             and "at Qz (" in entry["stack"][2]
                             and entry["value"] >= (
                                 page.get("performanceTimeOrigin", 0) +
                                 (capture.get("events") or [{}])[0].get("timeStamp", 0)
                             )],
        "fyStackTraces": [entry["raw"]["d1"]
                          for entry in capture.get("fyQu3Steps") or []
                          if entry.get("el") == 13 and entry.get("pc") == 520
                          and isinstance((entry.get("raw") or {}).get("d1"), str)],
        "fyTagQueries": {entry["tag"]: entry["length"] for entry in
                          capture.get("fyStyleVmInputs") or []
                          if entry.get("kind") == "tagQuery"
                          and isinstance(entry.get("tag"), str)
                          and isinstance(entry.get("length"), int)},
        "fyAudioCanPlayTypes": {entry["mime"]: entry["result"] for entry in
                                capture.get("fyStyleVmInputs") or []
                                if entry.get("kind") in ("canPlayType", "videoCanPlayType")
                                and isinstance(entry.get("mime"), str)
                                and isinstance(entry.get("result"), str)},
        "dssResponses": capture.get("dssResponses") or [],
        "dssResourceEntries": capture.get("dssResourceEntries") or [],
        "fyOrientationEvent": next(({"eventData": entry.get("eventData") or {},
                                      "timeStamp": entry.get("timeStamp"),
                                      "time": entry.get("time"),
                                      "dateNow": next((date_entry["value"] for date_entry in
                                                       startup.get("dateConstruct") or []
                                                       if "index1.js" in str((date_entry.get("stack") or [None, None])[1])
                                                       and abs(date_entry["value"] -
                                                               (page.get("performanceTimeOrigin", 0) + entry.get("time", 0))) < 5), None)}
                                     for entry in capture.get("fyMrCalls") or []
                                     if entry.get("eventType") == "deviceorientation"), None),
        "fyQz15Args": next((entry.get("replayArgs") for entry in
                            capture.get("fyQzCalls") or []
                            if entry.get("args", [None])[0] == ["number", 15]), None),
        "fyUmidResponse": next((entry.get("z28") for entry in
                                capture.get("fyMrCalls") or []
                                if entry.get("v") == 28), None),
        "noncePerformanceNow": next((entry.get("value") for entry in
                                     (startup.get("performance") or [])[1:2]), 1000),
        "dssAfterGateCount": next((index for index, gate in enumerate(
            capture.get("fyDg13GateChecks") or []) if gate.get("w24") == 1), None),
        "fyInitOptions": next((entry["args"][0] for entry in capture.get("fyEarlyCalls") or []
                               if entry["name"] == "init" and entry.get("args")),
                              page.get("fyOptions") or {}),
        "fyInitCookie": (capture.get("fyEvalSnapshot") or {}).get(
            "document.cookie", {}).get("replayValue"),
        "fyCallCookie": call.get("fyEnvironmentSnapshot", {}).get(
            "document.cookie", {}).get("replayValue"),
        "fyPriorCalls": prior,
        "fyRecordPriorCalls": record_prior,
        "fyRecordAfterMousedown": bool(
            record and capture.get("fy28Context")
            and (capture["fy28Context"][0].get("x") or 0) > next(
                (index for index, event in enumerate(capture.get("events") or [])
                 if event.get("type") == "mousedown"), float("inf"))),
        "fySerializerReplayBytes": ([entry.get("resultBytes") for entry in
                                      capture.get("fySerializerCalls") or []]
                                     if serializer_replay else None),
        "fyWindowNames": call.get("fyWindowNames"),
        "fyWindowKeys": call.get("fyWindowKeys"),
        "nonceWindowKeys": ((capture.get("fySerializerCalls") or [{}])[0]
                            .get("windowKeys")),
        "noncePrototypeKeys": {"Element": element_prototype_keys}
        if element_prototype_keys else {},
        "fyRootStyleProfile": next((entry.get("reg17Info")
                                   for entry in capture.get("fyVx7Writes") or []
                                   if (entry.get("reg17Info") or {}).get("rootStyle")), None),
        "fyComputedStyleProfile": {
            **(capture.get("fyComputedStyleProfile") or {}),
            "computedProperties": dict(zip(
                computed_style_step.get("raw11") or [],
                computed_style_step.get("styleValues") or [],
            )),
        },
        "fyEvalWindowNames": [name for name in capture.get("fyEvalWindowNames") or []
                              if name != "__fyEvalSnapshot"],
        "nonceDocumentHooks": [name for name in call.get("fyDocumentProperties") or {}
                               if name in ("__update_info", "__update_pos")],
        "canvasData": canvas_data,
        "canvas64DataTape": [entry["pixelData"] for entry in
                             capture["environment"].get("canvas2d") or []
                             if entry.get("method") == "getImageData"
                             and entry.get("canvasWidth") == 64
                             and isinstance(entry.get("pixelData"), list)],
        "webglProfile": {
            "ext": page.get("webglExtensions") or [],
            "constants": page.get("webglConstants") or {},
            "params": {str(entry["args"][0]): entry.get("value")
                       for entry in webgl
                       if entry.get("method") == "getParameter" and entry.get("args")},
            "paramTypes": {str(entry["args"][0]): entry.get("valueTag")
                           for entry in webgl
                           if entry.get("method") == "getParameter" and entry.get("args")},
            "contextAttributes": next((entry.get("value") for entry in webgl
                                       if entry.get("method") == "getContextAttributes"), None),
            "attribLocations": {entry["args"][1]: entry.get("value")
                                for entry in webgl
                                if entry.get("method") == "getAttribLocation"
                                and len(entry.get("args") or []) > 1},
            "precision": [{"a": entry["args"][0], "b": entry["args"][1],
                           **entry["precision"]}
                          for entry in webgl
                          if entry.get("method") == "getShaderPrecisionFormat"
                          and entry.get("precision")
                          and len(entry.get("args") or []) > 1],
        },
    }
    local = _local(payload)
    def serializer_diff(browser_calls: list[dict], local_calls: list[dict]) -> list[dict]:
        report = []
        for index, (browser_call, local_call) in enumerate(zip(browser_calls, local_calls)):
            browser_bytes = browser_call.get("resultBytes") or []
            local_bytes = local_call.get("resultBytes") or []
            matcher = difflib.SequenceMatcher(None, browser_bytes, local_bytes,
                                               autojunk=False)
            blocks = matcher.get_matching_blocks()
            report.append({"index": index, "browserLength": len(browser_bytes),
                           "localLength": len(local_bytes),
                           "browserHead": browser_bytes[:96],
                           "localHead": local_bytes[:96],
                           "differenceCount": sum(left != right for left, right in
                                                  zip(browser_bytes, local_bytes)),
                           "firstDifferences": [offset for offset, (left, right) in
                                                enumerate(zip(browser_bytes, local_bytes))
                                                if left != right][:25],
                           "matchingBlocks": [{"browserStart": block.a,
                                               "localStart": block.b,
                                               "length": block.size}
                                              for block in sorted(blocks, key=lambda block: -block.size)[:8]],
                           "firstDifference": next((offset for offset in range(
                               min(len(browser_bytes), len(local_bytes)))
                               if browser_bytes[offset] != local_bytes[offset]), None)})
        return report
    def fy_segments(value: str | None) -> list[dict]:
        return [{"length": len(part), "sha256": hashlib.sha256(part.encode()).hexdigest()[:12]}
                for part in (value or "").split("!")]
    prior_segment_diffs = [{"name": browser.get("name"),
                            "browser": fy_segments(browser.get("output")),
                            "local": fy_segments(local_value)}
                           for browser, local_value in zip(prior, local.get("fyPriorOutputs") or [])
                           if browser.get("name") == "getFYToken"]
    browser_trace = call.get("environment") or {}
    local_trace = local["fyTrace"]
    local_init_end = local["fyTraceAfterInit"]
    local_start = local["fyTraceStart"]
    local_end = local["fyTraceEnd"]
    trace_diff = {
        name: {
            "browserCount": len(browser_trace.get(name) or []),
            "localCount": len(local_trace[name][local_start[name]:local_end[name]]),
            "firstDifference": first_difference(
                browser_trace.get(name) or [],
                local_trace[name][local_start[name]:local_end[name]],
            ),
        }
        for name in ("canvas", "webgl")
    }
    first_prior = next((entry for entry in capture.get("fyEarlyCalls") or []
                        if entry["name"] == "getFYToken"), None)
    startup_trace = {
        name: {
            "browserCount": len(browser_calls),
            "localCount": len(local_trace[name][:local_init_end[name]]),
            "firstDifference": first_difference(
                browser_calls, local_trace[name][:local_init_end[name]],
            ),
        }
        for name in ("canvas", "webgl")
        for browser_calls in [[entry for entry in capture["environment"][name][
            :first_prior["environmentStart"][name] if first_prior else 0]
            if "index1.js" in str(entry.get("stack", []))]
        ]
    }
    browser_snapshot = call.get("fyEnvironmentSnapshot") or {}
    local_snapshot = local.get("fyEnvironmentSnapshot") or {}
    snapshot_paths = sorted(set(browser_snapshot) | set(local_snapshot))
    snapshot_differences = [name for name in snapshot_paths
                            if browser_snapshot.get(name) != local_snapshot.get(name)]
    browser_eval = capture.get("fyEvalSnapshot") or {}
    local_eval = local.get("fyEvalSnapshot") or {}
    eval_paths = sorted(set(browser_eval) | set(local_eval))
    eval_differences = [name for name in eval_paths
                        if browser_eval.get(name) != local_eval.get(name)]
    browser_branches = capture.get("fyBranchTrace") or []
    local_branches = local.get("fyBranchTrace") or []
    browser_entries = [{key: entry[key] for key in ("fn", "arg", "types", "parts")
                        if key in entry}
                       for entry in capture.get("fyEntryTrace") or []]
    local_entries = [{key: entry[key] for key in ("fn", "arg", "types", "parts")
                      if key in entry}
                     for entry in local.get("fyEntryTrace") or []]
    first_entry_difference = next(
        (index for index in range(max(len(browser_entries), len(local_entries)))
         if (browser_entries[index] if index < len(browser_entries) else None)
         != (local_entries[index] if index < len(local_entries) else None)), None,
    )
    entry_context = lambda entries: [
        {"fn": entry.get("fn"), "arg": entry.get("arg"),
         "types": entry.get("types"), "callerColumn": source_column(
             entry.get("stack", [None, None, None])[2])}
        for entry in entries[max(0, first_entry_difference - 4):first_entry_difference + 5]
    ] if first_entry_difference is not None else []
    browser_pixels = [{key: entry.get(key) for key in ("type", "length", "entryCount", "nonzero", "head", "tail")}
                      for entry in capture.get("fyPixelTrace") or []]
    local_pixels = [{key: entry.get(key) for key in ("type", "length", "entryCount", "nonzero", "head", "tail")}
                    for entry in local.get("fyPixelTrace") or []]
    browser_dg_steps = capture.get("fyDgSteps") or []
    local_dg_steps = local.get("fyDgSteps") or []
    browser_eb_steps = capture.get("fyEbSteps") or []
    local_eb_steps = local.get("fyEbSteps") or []
    browser_mr47 = capture.get("fyMr47Steps") or []
    local_mr47 = local.get("fyMr47Steps") or []
    first_mr47_difference = next(
        (index for index in range(max(len(browser_mr47), len(local_mr47)))
         if (browser_mr47[index] if index < len(browser_mr47) else None)
         != (local_mr47[index] if index < len(local_mr47) else None)), None,
    )
    first_mr47_p_difference = next(
        (index for index in range(min(len(browser_mr47), len(local_mr47)))
         if (browser_mr47[index].get("pType"), browser_mr47[index].get("pLength"))
         != (local_mr47[index].get("pType"), local_mr47[index].get("pLength"))), None,
    )
    first_eb_difference = next(
        (index for index in range(max(len(browser_eb_steps), len(local_eb_steps)))
         if (browser_eb_steps[index] if index < len(browser_eb_steps) else None)
         != (local_eb_steps[index] if index < len(local_eb_steps) else None)), None,
    )
    browser_dg_returns = capture.get("fyDgReturns") or []
    local_dg_returns = local.get("fyDgReturns") or []
    first_dg_return_difference = next(
        (index for index in range(max(len(browser_dg_returns), len(local_dg_returns)))
         if (browser_dg_returns[index] if index < len(browser_dg_returns) else None)
         != (local_dg_returns[index] if index < len(local_dg_returns) else None)), None,
    )
    def dg_calls(entries: list[dict]) -> list[dict]:
        return [{"zU": entry.get("zU"), "earlyCount": entry.get("earlyCount"),
                 "dCLength": entry.get("dCLength"),
                 "dCTag": entry.get("dCTag"), "dCKeys": entry.get("dCKeys"),
                 "eMTag": entry.get("eMTag"), "eMName": entry.get("eMName"),
                 "callerColumn": source_column((entry.get("stack") or [None, None])[1])}
                for entry in entries[:20]]
    first_dg_difference = next(
        (index for index in range(max(len(browser_dg_steps), len(local_dg_steps)))
         if (browser_dg_steps[index] if index < len(browser_dg_steps) else None)
         != (local_dg_steps[index] if index < len(local_dg_steps) else None)), None,
    )
    browser_mr22 = capture.get("fyMr22Steps") or []
    local_mr22 = local.get("fyMr22Steps") or []
    browser_mr56 = capture.get("fyMr56Steps") or []
    local_mr56 = local.get("fyMr56Steps") or []
    browser_mr3 = capture.get("fyMr3Steps") or []
    local_mr3 = local.get("fyMr3Steps") or []
    browser_qz = capture.get("fyQzSteps") or []
    local_qz = local.get("fyQzSteps") or []
    browser_j = capture.get("fyJSteps") or []
    local_j = local.get("fyJSteps") or []
    browser_vx7 = capture.get("fyVx7Steps") or []
    local_vx7 = local.get("fyVx7Steps") or []
    browser_vx7_inner = capture.get("fyVx7InnerSteps") or []
    local_vx7_inner = local.get("fyVx7InnerSteps") or []
    browser_serial_entries = capture.get("fySerialEntryTrace") or []
    local_serial_entries = local.get("fySerialEntryTrace") or []
    browser_serial_vx = capture.get("fySerialVxSteps") or []
    local_serial_vx = local.get("fySerialVxSteps") or []
    browser_xf1 = capture.get("fyXf1Steps") or []
    local_xf1 = local.get("fyXf1Steps") or []
    browser_style_names = browser_xf1[230].get("raw11") if len(browser_xf1) > 230 else None
    browser_style_values = browser_xf1[230].get("styleValues") if len(browser_xf1) > 230 else None
    local_style_values = local_xf1[230].get("styleValues") if len(local_xf1) > 230 else None
    first_style_value_difference = next(
        (index for index, (left, right) in enumerate(zip(browser_style_values or [],
                                                        local_style_values or [])) if left != right), None,
    )
    browser_mr11 = capture.get("fyMr11Steps") or []
    local_mr11 = local.get("fyMr11Steps") or []
    browser_c25 = capture.get("fyC25Steps") or []
    local_c25 = local.get("fyC25Steps") or []
    browser_qz5 = capture.get("fyQz5Steps") or []
    local_qz5 = local.get("fyQz5Steps") or []
    browser_mr16 = capture.get("fyMr16Steps") or []
    local_mr16 = local.get("fyMr16Steps") or []
    first_mr16_difference = next(
        (index for index in range(min(len(browser_mr16), len(local_mr16)))
         if {key: value for key, value in browser_mr16[index].items() if key != "entryCount"}
         != {key: value for key, value in local_mr16[index].items() if key != "entryCount"}), None,
    )
    first_qz5_difference = next(
        (index for index in range(min(len(browser_qz5), len(local_qz5)))
         if {key: value for key, value in browser_qz5[index].items() if key != "entryCount"}
         != {key: value for key, value in local_qz5[index].items() if key != "entryCount"}), None,
    )
    first_c25_difference = next(
        (index for index in range(min(len(browser_c25), len(local_c25)))
         if {key: value for key, value in browser_c25[index].items() if key != "entryCount"}
         != {key: value for key, value in local_c25[index].items() if key != "entryCount"}), None,
    )
    first_mr11_path_difference = next(
        (index for index in range(min(len(browser_mr11), len(local_mr11)))
         if (browser_mr11[index]["call"], browser_mr11[index]["pc"])
         != (local_mr11[index]["call"], local_mr11[index]["pc"])), None,
    )
    mr11_register_differences = {}
    for index in range(first_mr11_path_difference or min(len(browser_mr11), len(local_mr11))):
        browser_regs = dict(browser_mr11[index].get("regs") or [])
        local_regs = dict(local_mr11[index].get("regs") or [])
        for register in browser_regs.keys() | local_regs.keys():
            if register not in mr11_register_differences and browser_regs.get(register) != local_regs.get(register):
                mr11_register_differences[register] = {
                    "index": index, "pc": browser_mr11[index]["pc"],
                    "browser": browser_regs.get(register), "local": local_regs.get(register),
                }
    first_xf1_path_difference = next(
        (index for index in range(min(len(browser_xf1), len(local_xf1)))
         if (browser_xf1[index]["pc"], browser_xf1[index]["branch"],
             browser_xf1[index]["opcode"])
         != (local_xf1[index]["pc"], local_xf1[index]["branch"],
             local_xf1[index]["opcode"])), None,
    )
    xf1_q_difference = next(
        ({"index": index, "pc": browser_xf1[index]["pc"],
          "browser": {key: browser_xf1[index].get(key) for key in ("qSig", "qDeep")},
          "local": {key: local_xf1[index].get(key) for key in ("qSig", "qDeep")}}
         for index in range(first_xf1_path_difference or min(len(browser_xf1), len(local_xf1)))
         if (browser_xf1[index].get("qSig"), browser_xf1[index].get("qDeep"))
         != (local_xf1[index].get("qSig"), local_xf1[index].get("qDeep"))), None,
    )
    xf1_register_differences = {}
    for index in range(first_xf1_path_difference or min(len(browser_xf1), len(local_xf1))):
        browser_regs = dict(browser_xf1[index].get("regs") or [])
        local_regs = dict(local_xf1[index].get("regs") or [])
        for register in browser_regs.keys() | local_regs.keys():
            if register not in xf1_register_differences and browser_regs.get(register) != local_regs.get(register):
                xf1_register_differences[register] = {
                    "index": index, "pc": browser_xf1[index]["pc"],
                    "browser": browser_regs.get(register), "local": local_regs.get(register),
                }
    xf1_deep_differences = {
        field: next(({"index": index, "pc": browser_xf1[index]["pc"],
                      "browser": browser_xf1[index].get(field),
                      "local": local_xf1[index].get(field)}
                     for index in range(first_xf1_path_difference or min(len(browser_xf1), len(local_xf1)))
                     if browser_xf1[index].get(field) != local_xf1[index].get(field)), None)
        for field in ("deep12", "deep9")
    }
    browser_window_descriptors = capture.get("fyWindowDescriptorSnapshot") or {}
    local_window_descriptors = local.get("fyWindowDescriptorSnapshot") or {}
    window_descriptor_differences = [
        {"name": name, "browser": browser_window_descriptors.get(name),
         "local": local_window_descriptors.get(name)}
        for name in sorted(set(browser_window_descriptors) | set(local_window_descriptors))
        if not name.startswith("__")
        and browser_window_descriptors.get(name) != local_window_descriptors.get(name)
    ]
    first_serial_vx_difference = next(
        (index for index in range(min(len(browser_serial_vx), len(local_serial_vx)))
         if {key: value for key, value in browser_serial_vx[index].items() if key != "entryCount"}
         != {key: value for key, value in local_serial_vx[index].items() if key != "entryCount"}), None,
    )
    first_serial_entry_difference = next(
        (index for index in range(min(len(browser_serial_entries), len(local_serial_entries)))
         if {key: value for key, value in browser_serial_entries[index].items()
             if key not in ("stack", "jsonState")}
         != {key: value for key, value in local_serial_entries[index].items()
             if key not in ("stack", "jsonState")}), None,
    )
    first_vx7_inner_difference = next(
        (index for index in range(min(len(browser_vx7_inner), len(local_vx7_inner)))
         if browser_vx7_inner[index] != local_vx7_inner[index]), None,
    )
    first_vx7_inner_state_difference = next(
        (index for index in range(min(len(browser_vx7_inner), len(local_vx7_inner)))
         if (browser_vx7_inner[index]["pc"], browser_vx7_inner[index]["uDeep"])
         != (local_vx7_inner[index]["pc"], local_vx7_inner[index]["uDeep"])), None,
    )
    first_vx7_difference = next(
        (index for index in range(max(len(browser_vx7), len(local_vx7)))
         if (browser_vx7[index] if index < len(browser_vx7) else None)
         != (local_vx7[index] if index < len(local_vx7) else None)), None,
    )
    first_vx7_array9_difference = next(
        (index for index in range(min(len(browser_vx7), len(local_vx7)))
         if browser_vx7[index].get("array9") != local_vx7[index].get("array9")), None,
    )
    first_vx7_reg21_difference = next(
        (index for index in range(min(len(browser_vx7), len(local_vx7)))
         if browser_vx7[index].get("reg21") != local_vx7[index].get("reg21")), None,
    )
    first_j_difference = next(
        (index for index in range(max(len(browser_j), len(local_j)))
         if (browser_j[index] if index < len(browser_j) else None)
         != (local_j[index] if index < len(local_j) else None)), None,
    )
    first_qz_difference = next(
        (index for index in range(max(len(browser_qz), len(local_qz)))
         if (browser_qz[index] if index < len(browser_qz) else None)
         != (local_qz[index] if index < len(local_qz) else None)), None,
    )
    browser_mr43 = capture.get("fyMr43Steps") or []
    local_mr43 = local.get("fyMr43Steps") or []
    first_mr43_difference = next(
        (index for index in range(max(len(browser_mr43), len(local_mr43)))
         if (browser_mr43[index] if index < len(browser_mr43) else None)
         != (local_mr43[index] if index < len(local_mr43) else None)), None,
    )
    def comparable_mr43_signature(value: object) -> object:
        if isinstance(value, list) and value[:1] == ["[object Window]"]:
            return ["[object Window]"]
        return value

    first_mr43_value_difference = next(
        (index for index in range(min(len(browser_mr43), len(local_mr43)))
         if any(comparable_mr43_signature((browser_mr43[index].get("regSig") or {}).get(key))
                != comparable_mr43_signature((local_mr43[index].get("regSig") or {}).get(key))
                for key in (browser_mr43[index].get("regSig") or {}).keys()
                           | (local_mr43[index].get("regSig") or {}).keys())), None,
    )
    first_mr3_difference = next(
        (index for index in range(max(len(browser_mr3), len(local_mr3)))
         if (browser_mr3[index] if index < len(browser_mr3) else None)
         != (local_mr3[index] if index < len(local_mr3) else None)), None,
    )
    first_mr56_difference = next(
        (index for index in range(max(len(browser_mr56), len(local_mr56)))
         if (browser_mr56[index] if index < len(browser_mr56) else None)
         != (local_mr56[index] if index < len(local_mr56) else None)), None,
    )
    first_mr22_difference = next(
        (index for index in range(max(len(browser_mr22), len(local_mr22)))
         if (browser_mr22[index] if index < len(browser_mr22) else None)
         != (local_mr22[index] if index < len(local_mr22) else None)), None,
    )
    browser_gates = capture.get("fyDg13GateChecks") or []
    local_gates = local.get("fyDg13GateChecks") or []
    browser_profile = (browser_gates[0].get("wProfile") or {}) if browser_gates else {}
    local_profile = (local_gates[0].get("wProfile") or {}) if local_gates else {}
    profile_differences = [key for key in sorted(set(browser_profile) | set(local_profile),
                                                key=lambda key: int(key) if key.isdigit() else -1)
                           if browser_profile.get(key) != local_profile.get(key)]
    def gate_summary(entries: list[dict]) -> list[dict]:
        return [{key: value for key, value in entry.items() if key != "wProfile"}
                for entry in entries]
    def feature_writes(entries: list[dict]) -> list[dict]:
        return [{"index": entry.get("index"), "type": entry.get("type"),
                 "value": entry.get("value"),
                 "valueSig": entry.get("valueSig"),
                 "jCount": entry.get("jCount"),
                 "earlyCount": entry.get("earlyCount"),
                 "time": entry.get("time"),
                 "writerColumn": source_column((entry.get("stack") or [None, None])[1])}
                for entry in entries[:40]]
    def resource_queries(entries: list[dict]) -> list[dict]:
        return [{"targetTag": entry.get("targetTag"), "method": entry.get("method"),
                 "argumentLength": len(entry.get("argument") or ""),
                 "count": entry.get("count"),
                 "first": {key: (entry.get("first") or {}).get(key)
                           for key in ("entryType", "startTime", "duration", "responseEnd")}}
                for entry in entries[:5]]
    first_branch_difference = next(
        (index for index, (left, right) in enumerate(zip(browser_branches, local_branches))
         if left != right), None,
    )
    report = {
        "equal": call["output"] == local["fy"],
        "browserLength": len(call["output"]),
        "localLength": len(local["fy"]),
        "firstOutputDifference": next(
            (index for index, (left, right) in enumerate(zip(call["output"], local["fy"]))
             if left != right),
            min(len(call["output"]), len(local["fy"]))
            if len(call["output"]) != len(local["fy"]) else None,
        ),
        "eventCount": len(payload["events"]),
        "localWebglFallbacks": [entry for entry in (local.get("fyTrace") or {}).get("webgl", [])
                                if entry.get("fallback") and entry.get("serializing")][-100:],
        "randomCalls": {"browser": len(call["randomTape"]),
                        "local": local["randomConsumed"]},
        "startupRandomCalls": {"browser": len(payload["initRandomTape"]),
                               "local": local["initRandomConsumed"]},
        "startupRandomSites": {
            "browser": [source_column(entry.get("stack", [None, None])[1])
                        for entry in initial_random],
            "local": [source_column(frame[1] if len(frame) > 1 else None)
                      for frame in local["initRandomFrames"]],
        },
        "startupRandomRegisterCounts": {
            "browser": [entry.get("fyRegisterCount") for entry in initial_random],
            "local": local["initRandomRegisterCounts"],
        },
        "priorLocalLengths": local["fyPriorLengths"],
        "priorSegmentDiffs": prior_segment_diffs,
        "targetSegments": {"browser": fy_segments(call.get("output")),
                           "local": fy_segments(local.get("fy"))},
        "jsonStages": local.get("fyJsonStages") or [],
        "eventReads": local.get("fyEventReads") or [],
        "targetReads": local.get("fyTargetReads") or [],
        "styleVmInputs": {"browser": capture.get("fyStyleVmInputs") or [],
                          "local": local.get("fyStyleVmInputs") or []},
        "styleParentSteps": {"browser": capture.get("fyStyleParentSteps") or [],
                             "local": local.get("fyStyleParentSteps") or []},
        "qu3Steps": {"browser": capture.get("fyQu3Steps") or [],
                     "local": local.get("fyQu3Steps") or []},
        "xf0Writes": {"browser": capture.get("fyXf0Writes") or [],
                      "local": local.get("fyXf0Writes") or []},
        "jsonTrace": {"browser": capture.get("fyJsonTrace") or [],
                      "local": local.get("fyJsonTrace") or []},
        "fyMethodSource": {"length": len(local.get("fyMethodSource") or ""),
                           "prefix": (local.get("fyMethodSource") or "")[:350]},
        "orientationDispatch": local.get("fyOrientationDispatch"),
        "listenerOps": local.get("fyListenerOps"),
        "storageOps": local.get("fyStorageOps"),
        "dateCalls": local.get("fyDateCalls"),
        "canvasDataLength": len(canvas_data) if canvas_data else None,
        "canvas64ReplayFrames": len(payload["canvas64DataTape"]),
        "environment": trace_diff,
        "startupEnvironment": startup_trace,
        "snapshotDifferenceCount": len(snapshot_differences),
        "snapshotDifferences": snapshot_differences,
        "evalSnapshotDifferenceCount": len(eval_differences),
        "evalSnapshotDifferences": eval_differences,
        "branchTrace": {
            "browserCount": len(browser_branches), "localCount": len(local_branches),
            "firstDifference": first_branch_difference,
            "browserAtDifference": browser_branches[first_branch_difference]
            if first_branch_difference is not None else None,
            "localAtDifference": local_branches[first_branch_difference]
            if first_branch_difference is not None else None,
        } if capture.get("fyBranchTrace") is not None else None,
        "entryTrace": {
            "browserCount": len(browser_entries), "localCount": len(local_entries),
            "firstDifference": first_entry_difference,
            "browserAtDifference": browser_entries[first_entry_difference]
            if first_entry_difference is not None and first_entry_difference < len(browser_entries) else None,
            "localAtDifference": local_entries[first_entry_difference]
            if first_entry_difference is not None and first_entry_difference < len(local_entries) else None,
            "browserContext": entry_context(capture.get("fyEntryTrace") or []),
            "localContext": entry_context(local.get("fyEntryTrace") or []),
        } if capture.get("fyEntryTrace") is not None else None,
        "serialEntryTrace": {
            "browserCount": len(browser_serial_entries),
            "localCount": len(local_serial_entries),
            "firstDifference": first_serial_entry_difference,
            "browserContext": browser_serial_entries[max(0, first_serial_entry_difference - 3):first_serial_entry_difference + 3]
            if first_serial_entry_difference is not None else [],
            "localContext": local_serial_entries[max(0, first_serial_entry_difference - 3):first_serial_entry_difference + 3]
            if first_serial_entry_difference is not None else [],
            "browserVxAtDifference": [step for step in browser_serial_vx
                                       if first_serial_entry_difference is not None
                                       and step["entryCount"] in (first_serial_entry_difference,
                                                                  first_serial_entry_difference + 1)][-12:],
            "localVxAtDifference": [step for step in local_serial_vx
                                     if first_serial_entry_difference is not None
                                     and step["entryCount"] in (first_serial_entry_difference,
                                                                first_serial_entry_difference + 1)][-12:],
        },
        "serialEntryWindow": {"browser": browser_serial_entries[270:286],
                              "local": local_serial_entries[270:286]},
        "serialVxSteps": {
            "browserCount": len(browser_serial_vx), "localCount": len(local_serial_vx),
            "firstDifference": first_serial_vx_difference,
            "browserContext": browser_serial_vx[max(0, first_serial_vx_difference - 5):first_serial_vx_difference + 5]
            if first_serial_vx_difference is not None else [],
            "localContext": local_serial_vx[max(0, first_serial_vx_difference - 5):first_serial_vx_difference + 5]
            if first_serial_vx_difference is not None else [],
        },
        "xf1Steps": {
            "browserCount": len(browser_xf1), "localCount": len(local_xf1),
            "firstPathDifference": first_xf1_path_difference,
            "firstRegisterDifferences": xf1_register_differences,
            "firstDeepDifferences": xf1_deep_differences,
            "firstQDifference": xf1_q_difference,
            "firstQContext": {
                "browser": browser_xf1[max(0, xf1_q_difference["index"] - 2):xf1_q_difference["index"] + 3],
                "local": local_xf1[max(0, xf1_q_difference["index"] - 2):xf1_q_difference["index"] + 3],
            } if xf1_q_difference else None,
            "firstStyleValueDifference": {
                "index": first_style_value_difference,
                "name": browser_style_names[first_style_value_difference]
                if first_style_value_difference is not None else None,
                "browser": browser_style_values[first_style_value_difference]
                if first_style_value_difference is not None else None,
                "local": local_style_values[first_style_value_difference]
                if first_style_value_difference is not None else None,
            },
            "firstDeepContext": {
                "browser": browser_xf1[max(0, min(item["index"] for item in xf1_deep_differences.values() if item) - 2):
                                       min(item["index"] for item in xf1_deep_differences.values() if item) + 3],
                "local": local_xf1[max(0, min(item["index"] for item in xf1_deep_differences.values() if item) - 2):
                                   min(item["index"] for item in xf1_deep_differences.values() if item) + 3],
            } if any(xf1_deep_differences.values()) else None,
            "firstRegisterContext": {
                "browser": browser_xf1[max(0, min(item["index"] for item in xf1_register_differences.values()) - 8):
                                       min(item["index"] for item in xf1_register_differences.values()) + 3],
                "local": local_xf1[max(0, min(item["index"] for item in xf1_register_differences.values()) - 8):
                                   min(item["index"] for item in xf1_register_differences.values()) + 3],
            } if xf1_register_differences else None,
            "browserContext": browser_xf1[max(0, first_xf1_path_difference - 5):first_xf1_path_difference + 5]
            if first_xf1_path_difference is not None else [],
            "localContext": local_xf1[max(0, first_xf1_path_difference - 5):first_xf1_path_difference + 5]
            if first_xf1_path_difference is not None else [],
        },
        "mr11Steps": {
            "browserCount": len(browser_mr11), "localCount": len(local_mr11),
            "firstPathDifference": first_mr11_path_difference,
            "firstRegisterDifferences": mr11_register_differences,
            "browserContext": browser_mr11[max(0, (first_mr11_path_difference or 0) - 5):(first_mr11_path_difference or 0) + 5],
            "localContext": local_mr11[max(0, (first_mr11_path_difference or 0) - 5):(first_mr11_path_difference or 0) + 5],
        },
        "c25Steps": {
            "browserCount": len(browser_c25), "localCount": len(local_c25),
            "firstDifference": first_c25_difference,
            "firstCall": {"browser": browser_c25[:5], "local": local_c25[:5]},
            "browserContext": browser_c25[max(0, (first_c25_difference or 0) - 3):(first_c25_difference or 0) + 4],
            "localContext": local_c25[max(0, (first_c25_difference or 0) - 3):(first_c25_difference or 0) + 4],
        },
        "qz5Steps": {
            "browserCount": len(browser_qz5), "localCount": len(local_qz5),
            "firstDifference": first_qz5_difference,
            "browserContext": browser_qz5[max(0, (first_qz5_difference or 0) - 3):(first_qz5_difference or 0) + 4],
            "localContext": local_qz5[max(0, (first_qz5_difference or 0) - 3):(first_qz5_difference or 0) + 4],
        },
        "mr16Steps": {
            "browserCount": len(browser_mr16), "localCount": len(local_mr16),
            "firstDifference": first_mr16_difference,
            "browserContext": browser_mr16[max(0, (first_mr16_difference or 0) - 3):(first_mr16_difference or 0) + 4],
            "localContext": local_mr16[max(0, (first_mr16_difference or 0) - 3):(first_mr16_difference or 0) + 4],
        },
        "windowDescriptorSnapshot": {
            "browserCount": len(browser_window_descriptors),
            "localCount": len(local_window_descriptors),
            "differenceCount": len(window_descriptor_differences),
            "differences": window_descriptor_differences[:80],
        },
        "pixelTrace": {
            "browserCount": len(browser_pixels), "localCount": len(local_pixels),
            "equal": browser_pixels == local_pixels,
            "browserFirst": browser_pixels[0] if browser_pixels else None,
            "localFirst": local_pixels[0] if local_pixels else None,
        } if capture.get("fyPixelTrace") is not None else None,
        "localSmallCanvasTrace": local.get("fySmallCanvasTrace"),
        "dgSteps": {
            "browserCount": len(browser_dg_steps), "localCount": len(local_dg_steps),
            "firstDifference": first_dg_difference,
            "browserContext": browser_dg_steps[max(0, first_dg_difference - 5):
                                                first_dg_difference + 5]
            if first_dg_difference is not None else [],
            "localContext": local_dg_steps[max(0, first_dg_difference - 5):
                                            first_dg_difference + 5]
            if first_dg_difference is not None else [],
        } if capture.get("fyDgSteps") is not None else None,
        "dgWindowChecks": {"browser": capture.get("fyDgWindowChecks"),
                           "local": local.get("fyDgWindowChecks")}
        if capture.get("fyDgWindowChecks") is not None else None,
        "dgObjectChecks": {"browser": capture.get("fyDgObjectChecks"),
                           "local": local.get("fyDgObjectChecks")}
        if capture.get("fyDgObjectChecks") is not None else None,
        "dgStringChecks": {"browser": capture.get("fyDgStringChecks"),
                           "local": local.get("fyDgStringChecks")}
        if capture.get("fyDgStringChecks") is not None else None,
        "dgNavigatorChecks": {"browser": capture.get("fyDgNavigatorChecks"),
                              "local": local.get("fyDgNavigatorChecks")}
        if capture.get("fyDgNavigatorChecks") is not None else None,
        "dgLoadChecks": {"browser": capture.get("fyDgLoadChecks"),
                         "local": local.get("fyDgLoadChecks")}
        if capture.get("fyDgLoadChecks") is not None else None,
        "dgLoadKeyChecks": {"browser": capture.get("fyDgLoadKeyChecks"),
                            "local": local.get("fyDgLoadKeyChecks")},
        "dgFeatureChecks": {"browser": capture.get("fyDgFeatureChecks"),
                            "local": local.get("fyDgFeatureChecks")}
        if capture.get("fyDgFeatureChecks") is not None else None,
        "dgTopPropertyChecks": {"browser": capture.get("fyDgTopPropertyChecks"),
                                "local": local.get("fyDgTopPropertyChecks")}
        if capture.get("fyDgTopPropertyChecks") is not None else None,
        "dgElementChecks": {"browser": capture.get("fyDgElementChecks"),
                            "local": local.get("fyDgElementChecks")},
        "dgCase18Checks": {"browser": capture.get("fyDgCase18Checks"),
                           "local": local.get("fyDgCase18Checks")},
        "dgReturns": {"browser": (capture.get("fyDgReturns") or [])[:10],
                      "local": (local.get("fyDgReturns") or [])[:10],
                      "browserCount": len(browser_dg_returns),
                      "localCount": len(local_dg_returns),
                      "firstDifference": first_dg_return_difference,
                      "browserAtDifference": browser_dg_returns[first_dg_return_difference]
                      if first_dg_return_difference is not None and first_dg_return_difference < len(browser_dg_returns) else None,
                      "localAtDifference": local_dg_returns[first_dg_return_difference]
                      if first_dg_return_difference is not None and first_dg_return_difference < len(local_dg_returns) else None},
        "dgCalls": {"browser": dg_calls(capture.get("fyDgCalls") or []),
                    "local": dg_calls(local.get("fyDgCalls") or [])},
        "dg13GateChecks": {"browser": gate_summary(browser_gates),
                           "local": gate_summary(local_gates)},
        "wProfile": {"browserCount": len(browser_profile),
                     "localCount": len(local_profile),
                     "differenceCount": len(profile_differences),
                     "differences": [{"index": key, "browser": browser_profile.get(key),
                                      "local": local_profile.get(key)}
                                     for key in profile_differences[:30]]},
        "featureWrites": {"browser": feature_writes(capture.get("fyFeatureWrites") or []),
                          "local": feature_writes(local.get("fyFeatureWrites") or [])},
        "feature28Context": {"browser": capture.get("fy28Context") or [],
                             "local": local.get("fy28Context") or []},
        "feature11Writes": {
            "browser": [entry for entry in capture.get("fyFeatureWrites") or []
                        if entry.get("index") == "11_item"],
            "local": [entry for entry in local.get("fyFeatureWrites") or []
                      if entry.get("index") == "11_item"],
        },
        "feature115Writes": {"browser": capture.get("fy115Writes") or [],
                             "local": local.get("fy115Writes") or []},
        "fy24Context": {"browser": capture.get("fy24Context") or [],
                        "local": local.get("fy24Context") or []},
        "fy24AlternateContext": local.get("fy24AlternateContext") or [],
        "mr22Steps": {"browserCount": len(browser_mr22), "localCount": len(local_mr22),
                      "firstDifference": first_mr22_difference,
                      "browserContext": browser_mr22[max(0, first_mr22_difference - 5):first_mr22_difference + 5]
                      if first_mr22_difference is not None else [],
                      "localContext": local_mr22[max(0, first_mr22_difference - 5):first_mr22_difference + 5]
                      if first_mr22_difference is not None else []},
        "mr56Steps": {"browserCount": len(browser_mr56), "localCount": len(local_mr56),
                      "firstDifference": first_mr56_difference,
                      "browserContext": browser_mr56[max(0, first_mr56_difference - 5):first_mr56_difference + 5]
                      if first_mr56_difference is not None else [],
                      "localContext": local_mr56[max(0, first_mr56_difference - 5):first_mr56_difference + 5]
                      if first_mr56_difference is not None else []},
        "mr3Steps": {"browserCount": len(browser_mr3), "localCount": len(local_mr3),
                     "firstDifference": first_mr3_difference,
                     "browserContext": browser_mr3[max(0, first_mr3_difference - 5):first_mr3_difference + 5]
                     if first_mr3_difference is not None else [],
                     "localContext": local_mr3[max(0, first_mr3_difference - 5):first_mr3_difference + 5]
                     if first_mr3_difference is not None else []},
        "mr43Steps": {"browserCount": len(browser_mr43), "localCount": len(local_mr43),
                      "firstDifference": first_mr43_difference,
                      "firstValueDifference": first_mr43_value_difference,
                      "valueDifference": ({"browserPc": browser_mr43[first_mr43_value_difference]["pc"],
                                           "localPc": local_mr43[first_mr43_value_difference]["pc"],
                                           "registers": [{"key": key,
                                                          "browser": browser_mr43[first_mr43_value_difference]
                                                          .get("regSig", {}).get(key),
                                                          "local": local_mr43[first_mr43_value_difference]
                                                          .get("regSig", {}).get(key)}
                                                         for key in sorted(
                                                             (browser_mr43[first_mr43_value_difference]
                                                              .get("regSig") or {}).keys()
                                                             | (local_mr43[first_mr43_value_difference]
                                                                .get("regSig") or {}).keys(),
                                                             key=lambda item: int(item))
                                                         if comparable_mr43_signature(
                                                             browser_mr43[first_mr43_value_difference]
                                                             .get("regSig", {}).get(key))
                                                         != comparable_mr43_signature(
                                                             local_mr43[first_mr43_value_difference]
                                                             .get("regSig", {}).get(key))]}
                                          if first_mr43_value_difference is not None else None),
                      "browserContext": browser_mr43[max(0, first_mr43_difference - 5):first_mr43_difference + 5]
                      if first_mr43_difference is not None else [],
                      "localContext": local_mr43[max(0, first_mr43_difference - 5):first_mr43_difference + 5]
                      if first_mr43_difference is not None else []},
        "mr43Writes": {"browser": capture.get("fyMr43Writes") or [],
                       "local": local.get("fyMr43Writes") or []},
        "mr43Lookup": {"browser": capture.get("fyMr43Lookup") or [],
                       "local": local.get("fyMr43Lookup") or []},
        "qzCalls": {"browser": capture.get("fyQzCalls") or [],
                    "local": local.get("fyQzCalls") or []},
        "jCalls": {"browser": capture.get("fyJCalls") or [],
                   "local": local.get("fyJCalls") or []},
        "jSteps": {"browserCount": len(browser_j), "localCount": len(local_j),
                   "firstDifference": first_j_difference,
                   "browserContext": browser_j[max(0, first_j_difference - 5):first_j_difference + 5]
                   if first_j_difference is not None else [],
                   "localContext": local_j[max(0, first_j_difference - 5):first_j_difference + 5]
                   if first_j_difference is not None else []},
        "jInvoke": {"browser": capture.get("fyJInvoke") or [],
                    "local": local.get("fyJInvoke") or []},
        "vx7Steps": {"browserCount": len(browser_vx7), "localCount": len(local_vx7),
                     "firstDifference": first_vx7_difference,
                     "firstArray9Difference": first_vx7_array9_difference,
                     "firstReg21Difference": first_vx7_reg21_difference,
                     "browserReg21Context": browser_vx7[max(0, first_vx7_reg21_difference - 4):first_vx7_reg21_difference + 4]
                     if first_vx7_reg21_difference is not None else [],
                     "localReg21Context": local_vx7[max(0, first_vx7_reg21_difference - 4):first_vx7_reg21_difference + 4]
                     if first_vx7_reg21_difference is not None else [],
                     "browserArray9Context": browser_vx7[max(0, first_vx7_array9_difference - 4):first_vx7_array9_difference + 4]
                     if first_vx7_array9_difference is not None else [],
                     "localArray9Context": local_vx7[max(0, first_vx7_array9_difference - 4):first_vx7_array9_difference + 4]
                     if first_vx7_array9_difference is not None else [],
                     "browserContext": browser_vx7[max(0, first_vx7_difference - 5):first_vx7_difference + 5]
                     if first_vx7_difference is not None else [],
                     "localContext": local_vx7[max(0, first_vx7_difference - 5):first_vx7_difference + 5]
                     if first_vx7_difference is not None else []},
        "vx7Writes": {"browser": capture.get("fyVx7Writes") or [],
                      "local": local.get("fyVx7Writes") or []},
        "vx7InnerSteps": {"browserCount": len(browser_vx7_inner),
                          "localCount": len(local_vx7_inner),
                          "firstDifference": first_vx7_inner_difference,
                          "firstStateDifference": first_vx7_inner_state_difference,
                          "browserStateContext": browser_vx7_inner[max(0, first_vx7_inner_state_difference - 3):first_vx7_inner_state_difference + 3]
                          if first_vx7_inner_state_difference is not None else [],
                          "localStateContext": local_vx7_inner[max(0, first_vx7_inner_state_difference - 3):first_vx7_inner_state_difference + 3]
                          if first_vx7_inner_state_difference is not None else [],
                          "browserContext": browser_vx7_inner[max(0, first_vx7_inner_difference - 3):first_vx7_inner_difference + 3]
                          if first_vx7_inner_difference is not None else [],
                          "localContext": local_vx7_inner[max(0, first_vx7_inner_difference - 3):first_vx7_inner_difference + 3]
                          if first_vx7_inner_difference is not None else []},
        "qzSteps": {"browserCount": len(browser_qz), "localCount": len(local_qz),
                    "firstDifference": first_qz_difference,
                    "browserContext": browser_qz[max(0, first_qz_difference - 5):first_qz_difference + 5]
                    if first_qz_difference is not None else [],
                    "localContext": local_qz[max(0, first_qz_difference - 5):first_qz_difference + 5]
                    if first_qz_difference is not None else []},
        "mr22Gate": {"browser": capture.get("fyMr22Gate") or [],
                     "local": local.get("fyMr22Gate") or []},
        "dg13WCall": {"browser": capture.get("fyDg13WCall") or [],
                      "local": local.get("fyDg13WCall") or []},
        "dg14Gate": {"browser": capture.get("fyDg14Gate") or [],
                     "local": local.get("fyDg14Gate") or []},
        "builderTrace": {"browser": capture.get("fyBuilderTrace") or [],
                         "local": local.get("fyBuilderTrace") or []},
        "ebSteps": {"browserCount": len(browser_eb_steps), "localCount": len(local_eb_steps),
                    "firstDifference": first_eb_difference,
                    "browserContext": browser_eb_steps[max(0, first_eb_difference - 5):first_eb_difference + 5]
                    if first_eb_difference is not None else [],
                    "localContext": local_eb_steps[max(0, first_eb_difference - 5):first_eb_difference + 5]
                    if first_eb_difference is not None else []},
        "ebCallTrace": {"browser": capture.get("fyEbCallTrace") or [],
                        "local": local.get("fyEbCallTrace") or []},
        "mr47Steps": {"browserCount": len(browser_mr47), "localCount": len(local_mr47),
                      "firstDifference": first_mr47_difference,
                      "firstPLengthDifference": first_mr47_p_difference,
                      "browserPContext": browser_mr47[max(0, first_mr47_p_difference - 5):first_mr47_p_difference + 5]
                      if first_mr47_p_difference is not None else [],
                      "localPContext": local_mr47[max(0, first_mr47_p_difference - 5):first_mr47_p_difference + 5]
                      if first_mr47_p_difference is not None else [],
                      "browserContext": browser_mr47[max(0, first_mr47_difference - 5):first_mr47_difference + 5]
                      if first_mr47_difference is not None else [],
                      "localContext": local_mr47[max(0, first_mr47_difference - 5):first_mr47_difference + 5]
                      if first_mr47_difference is not None else []},
        "mr47Loop": {"browser": capture.get("fyMr47Loop") or [],
                     "local": local.get("fyMr47Loop") or []},
        "mr47D6Writes": {"browser": [{"type": entry.get("type"), "value": entry.get("value"),
                                       "length": entry.get("length"),
                                       "writerColumn": source_column((entry.get("stack") or [None, None])[1])}
                                      for entry in capture.get("fyMr47D6Writes") or []],
                         "local": [{"type": entry.get("type"), "value": entry.get("value"),
                                    "length": entry.get("length"),
                                    "writerColumn": source_column((entry.get("stack") or [None, None])[1])}
                                   for entry in local.get("fyMr47D6Writes") or []]},
        "mr47Writes": {"browser": [{"key": entry.get("key"), "type": entry.get("type"),
                                     "tag": entry.get("tag"), "value": entry.get("value"),
                                     "length": entry.get("length"),
                                     "writerColumn": source_column((entry.get("stack") or [None, None])[1])}
                                    for entry in capture.get("fyMr47Writes") or []],
                       "local": [{"key": entry.get("key"), "type": entry.get("type"),
                                  "tag": entry.get("tag"), "value": entry.get("value"),
                                  "length": entry.get("length"),
                                  "writerColumn": source_column((entry.get("stack") or [None, None])[1])}
                                 for entry in local.get("fyMr47Writes") or []]},
        "mrCalls": {"browser": [{"v": entry.get("v"), "vTag": entry.get("vTag"),
                                  "thisTag": entry.get("thisTag"), "thisValue": entry.get("thisValue"),
                                  "args": entry.get("args") if entry.get("v") in (3, 10, 28, 43) else None,
                                  "vKeys": entry.get("vKeys"), "eventType": entry.get("eventType"),
                                  "eventData": entry.get("eventData"),
                                  "targetTag": entry.get("targetTag"), "dataTag": entry.get("dataTag"),
                                  "isTrusted": entry.get("isTrusted"), "timeStamp": entry.get("timeStamp"),
                                  "time": entry.get("time"),
                                  "earlyCount": entry.get("earlyCount"),
                                  "callerColumn": source_column(((entry.get("stack") or []) + [None, None, None])[2])}
                                 for entry in capture.get("fyMrCalls") or []],
                    "local": [{"v": entry.get("v"), "vTag": entry.get("vTag"),
                                "thisTag": entry.get("thisTag"), "thisValue": entry.get("thisValue"),
                                "args": entry.get("args") if entry.get("v") in (3, 10, 28, 43) else None,
                                "vKeys": entry.get("vKeys"), "eventType": entry.get("eventType"),
                                "eventData": entry.get("eventData"),
                                "targetTag": entry.get("targetTag"), "dataTag": entry.get("dataTag"),
                                "isTrusted": entry.get("isTrusted"), "timeStamp": entry.get("timeStamp"),
                                "time": entry.get("time"),
                                "earlyCount": entry.get("earlyCount"),
                                "callerColumn": source_column(((entry.get("stack") or []) + [None, None, None])[2])}
                               for entry in local.get("fyMrCalls") or []]},
        "serializerCalls": {"browser": [{key: value for key, value in entry.items()
                                           if key not in ("resultBytes", "windowKeys")}
                                          for entry in capture.get("fySerializerCalls") or []],
                            "local": [{key: value for key, value in entry.items()
                                         if key != "resultBytes"}
                                        for entry in local.get("fySerializerCalls") or []],
                            "byteAlignment": serializer_diff(capture.get("fySerializerCalls") or [],
                                                              local.get("fySerializerCalls") or [])},
        "scriptReplay": {"browserResponseCount": len(capture.get("dssResponses") or []),
                         "localCallbackPresent": local.get("fyUmPerfCallbackPresent"),
                         "localCreates": local.get("fyScriptCreates") or [],
                         "localAppends": [{"srcLength": len(entry.get("src") or ""),
                                           "time": entry.get("time")}
                                          for entry in local.get("fyScriptAppends") or []]},
        "resourceQueries": {"browser": resource_queries(capture.get("fyResourceQueries") or []),
                            "local": resource_queries(local.get("fyResourceQueries") or [])},
    }
    if return_local_value:
        report["localValue"] = local["fy"]
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="逐项比较 FY 浏览器调用和本地 VM")
    parser.add_argument("link_type", choices=("captchacapslidev2",))
    parser.add_argument("--capture", type=Path, help="复用已采集的 JSON")
    parser.add_argument("--trace-branch", action=argparse.BooleanOptionalAction,
                        default=True, help="定向记录 FY VM 分支，默认开启")
    parser.add_argument("--summary", action="store_true",
                        help="只输出长度、轨迹数量和逐字节一致性")
    parser.add_argument("--serializer-replay", action="store_true",
                        help="诊断用：以浏览器序列化字节替换本地结果，检查后续编码")
    args = parser.parse_args()
    path = args.capture or OUTPUT
    if args.capture is None:
        command = [sys.executable, str(CAPTURE), args.link_type, "--startup-trace",
                   "--probe-fy", "--capture-only", "--capture-output", str(path)]
        if args.trace_branch:
            command.append("--trace-fy-branch")
        subprocess.run(
            command,
            check=True, stdout=subprocess.DEVNULL,
        )
    capture = json.loads(path.read_text(encoding="utf-8"))
    probe = capture.get("fyProbe")
    if not isinstance(probe, dict) or "call" not in probe:
        parser.error("采集文件缺少 FY 探针，请使用 --probe-fy 重新采集")
    earlier = [entry for entry in capture.get("fyEarlyCalls") or []
               if entry["name"] in ("getFYToken", "getUidToken") and entry["beforeHook"]]
    baseline = compare_call(capture, probe["call"], prior=earlier, record=False)
    final_call = next(call for call in capture["calls"] if call["label"] == "fy")
    drag = compare_call(capture, final_call,
                        prior=[*earlier, probe["call"]], record=True,
                        serializer_replay=args.serializer_replay)
    asset_equal = capture.get("fyAssetStats") == asset_stats(
        FY_ASSET.read_text(encoding="utf-8").rstrip("\n"))
    if args.summary:
        print(json.dumps({
            "baseline": {key: baseline[key] for key in
                         ("equal", "browserLength", "localLength")},
            "drag": {key: drag[key] for key in
                     ("equal", "browserLength", "localLength", "eventCount",
                      "firstOutputDifference")},
            "fyAssetEqual": asset_equal,
            "serializerReplay": args.serializer_replay,
        }, ensure_ascii=False))
    else:
        print(json.dumps({"capture": str(path), "baseline": baseline, "drag": drag,
                          "browserPriorCalls": [entry["name"] for entry in earlier],
                          "browserPriorLengths": [len(entry.get("output") or "")
                                                  for entry in earlier],
                          "fyRoutePatched": capture.get("fyRoutePatched"),
                          "fyAssetEqual": asset_equal,
                          "browserFyOptions": capture["page"].get("fyOptions")},
                         ensure_ascii=False))


if __name__ == "__main__":
    main()
