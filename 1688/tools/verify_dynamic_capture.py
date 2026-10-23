"""Summarize same-input FY, nonce, and ET checks for one captured verify request."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from capture_dynamic import _local, make_et_payload, make_nonce_payload
from diff_fy_trace import compare_call


def comparison(browser: str, local: str) -> dict[str, object]:
    first_difference = next(
        (index for index, (left, right) in enumerate(zip(browser, local))
         if left != right),
        min(len(browser), len(local)) if len(browser) != len(local) else None,
    )
    return {"equal": browser == local, "browser_length": len(browser),
            "local_length": len(local), "first_difference": first_difference}


def verify(capture: dict) -> dict[str, object]:
    calls = capture.get("calls") or []
    if sorted(call["label"] for call in calls) != ["et", "fy", "nonce"]:
        raise ValueError("capture must contain one FY, nonce, and ET target call")
    if len(capture.get("verifyRequests") or []) != 1:
        raise ValueError("capture must contain one verify request")
    fy_call = next(call for call in calls if call["label"] == "fy")
    nonce_call = next(call for call in calls if call["label"] == "nonce")
    et_call = next(call for call in calls if call["label"] == "et")
    early = [entry for entry in capture.get("fyEarlyCalls") or []
             if entry["name"] in ("getFYToken", "getUidToken")
             and entry["beforeHook"]]
    baseline_call = (capture.get("fyProbe") or {}).get("call")
    if baseline_call is None:
        raise ValueError("capture lacks the FY baseline probe")
    fy_baseline = compare_call(capture, baseline_call, prior=early, record=False)
    fy_drag = compare_call(capture, fy_call,
                           prior=[*early, baseline_call], record=True)
    et = _local(make_et_payload(capture, et_call, replay_startup=True,
                                trace_et_pc=True))
    nonce_payload = make_nonce_payload(capture, nonce_call, trace_gt=True,
                                       auto_env=True)
    nonce = _local(nonce_payload)
    browser_svg = {entry["src"] for entry in capture.get("nonceImageLoads") or []
                   if entry["src"].startswith("data:image/svg+xml;base64,")}
    digest = lambda items: [(item["length"], item["hash"])
                            for item in items or []]
    response = (capture.get("verifyResponses") or [None])[0] or {}
    return {
        "browser_verify_code": (response.get("body") or {}).get("result", {}).get("code"),
        "x5sec_issued": bool(response.get("x5secIssued")),
        "fy_baseline": {key: fy_baseline[key] for key in
                        ("equal", "browserLength", "localLength")},
        "fy_drag": {key: fy_drag[key] for key in
                    ("equal", "browserLength", "localLength", "eventCount",
                     "firstOutputDifference")},
        "et": comparison(et_call["output"], et["et"]),
        "nonce": comparison(nonce_call["output"], nonce["nonce"]),
        "nonce_svg_equal": nonce.get("nonceSvgSource") in browser_svg,
        "nonce_digest_equal": digest(capture.get("nonceDigestTrace")) ==
        digest(nonce.get("nonceDigestTrace")),
        "nonce_error_stacks_replayed": len(nonce_payload["nonceErrorStacks"]),
        "browser_et_used_in_request": capture["verifyRequests"][0]["et"] ==
        et_call["output"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture", type=Path)
    args = parser.parse_args()
    capture = json.loads(args.capture.read_text(encoding="utf-8"))
    print(json.dumps(verify(capture), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
