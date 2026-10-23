"""采集人工正确拖动后的真实浏览器请求，并重放动态参数调用。"""

from __future__ import annotations

import argparse
import base64
import gzip
import json
import time
from pathlib import Path

from capture_dynamic import build_capture_code
from get_challenge import get_challenge
from manual_drag import _OUTPUT, _playwright, _private_json, _result


_STATE = _OUTPUT / "dynamic_manual_session.json"


def start() -> dict[str, object]:
    if _STATE.exists():
        previous = json.loads(_STATE.read_text())
        try:
            _playwright(previous["session"], "close", timeout=15)
        except Exception:
            pass
        _STATE.unlink(missing_ok=True)
    challenge = get_challenge("captchacapslidev2")
    session = f"dynamic_manual_{int(time.time())}"
    _playwright(session, "open", "about:blank", "--headed")
    try:
        code = build_capture_code(
            challenge, manual_drag=True, startup_trace=True,
            trace_et_pc=True, trace_nonce_gt=True,
            probe_fy=True, trace_fy_branch=True,
        )
        ready = _result(_playwright(session, "run-code", code, timeout=120))
        if not ready.get("ready") or not ready.get("buttonVisible"):
            raise ValueError("动态采集页面没有就绪")
    except Exception:
        _playwright(session, "close", timeout=15)
        raise
    _private_json(_STATE, {"session": session})
    return {"ready": True, "session": session}


def status() -> dict[str, object]:
    state = json.loads(_STATE.read_text())
    result = _result(_playwright(state["session"], "run-code", """
async (page) => ({
  ready: Boolean(page.__dynamicCollect),
  snapshotCount: page.__dynamicSnapshots?.length || 0,
  responseCodes: (await Promise.all(page.__dynamicVerifyResponses || []))
    .map(item => item?.body?.result?.code ?? null),
})
"""))
    return result


def finish() -> dict[str, object]:
    state = json.loads(_STATE.read_text())
    session = state["session"]
    try:
        packed = _result(_playwright(session, "run-code", """
async (page) => {
  if (!page.__dynamicCollect) throw new Error('动态采集未就绪');
  return { snapshots: page.__dynamicSnapshots || [],
    responses: await Promise.all(page.__dynamicVerifyResponses || []) };
}
""", timeout=120))
        snapshots = packed["snapshots"]
        responses = packed["responses"]
        if not snapshots:
            return {"captured": False, "response_codes": [
                (item or {}).get("body", {}).get("result", {}).get("code")
                for item in responses]}
        captures = [json.loads(gzip.decompress(
            base64.b64decode(item["gzip"], validate=True),
        )) for item in snapshots]
        success_indices = [index for index, item in enumerate(responses)
                           if (item or {}).get("body", {}).get("result", {}).get("code") == 0]
        selected_index = success_indices[0] if success_indices else len(captures) - 1
        capture = captures[min(selected_index, len(captures) - 1)]
        capture["verifyResponses"] = responses
        path = _OUTPUT / f"{session}_capture.json"
        _private_json(path, capture)
        for index, item in enumerate(captures):
            if index != selected_index:
                _private_json(_OUTPUT / f"{session}_attempt_{index + 1}.json", item)
    finally:
        _playwright(session, "close", timeout=15)
        _STATE.unlink(missing_ok=True)
    responses = capture.get("verifyResponses") or []
    response = responses[selected_index] if selected_index < len(responses) else None
    calls = capture.get("calls") or []
    summary: dict[str, object] = {
        "capture": str(path),
        "browser_verify_code": (response or {}).get("body", {}).get("result", {}).get("code"),
        "x5sec_issued": (response or {}).get("x5secIssued", False),
        "call_labels": [call.get("label") for call in calls],
        "verify_request_count": len(capture.get("verifyRequests") or []),
        "event_count": len(capture.get("events") or []),
        "attempt_count": len(captures),
        "response_codes": [(item or {}).get("body", {}).get("result", {}).get("code")
                           for item in responses],
    }
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("start", "status", "finish"))
    args = parser.parse_args()
    try:
        result = {"start": start, "status": status, "finish": finish}[args.command]()
    except Exception as exc:
        # 错误文字可能带令牌、Cookie 或挑战链接，不直接输出。
        print(json.dumps({"error_type": type(exc).__name__}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
