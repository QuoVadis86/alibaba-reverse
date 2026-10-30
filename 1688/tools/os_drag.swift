// OS 级鼠标轨迹注入（macOS CGEvent）。
//
// 用法：os_drag <points.json>
// points.json: {"points": [[t_ms, screen_x, screen_y], ...]}
//
// 与 CDP 派发不同，CGEvent 走 HID 事件通道，浏览器看到的是真实硬件输入，
// pressure / movement / sourceCapabilities 等属性与人工拖动一致。
//
// 需要辅助功能权限（系统设置 → 隐私与安全性 → 辅助功能）。

import Foundation
import CoreGraphics
import ApplicationServices

struct Payload: Decodable {
    let points: [[Double]]
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

guard CommandLine.arguments.count >= 2 else { fail("usage: os_drag <points.json>") }

let path = CommandLine.arguments[1]
guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else {
    fail("cannot read \(path)")
}
guard let payload = try? JSONDecoder().decode(Payload.self, from: data),
      payload.points.count >= 2 else {
    fail("invalid payload: need at least two points")
}

guard AXIsProcessTrusted() else {
    fail("accessibility permission missing")
}

let source = CGEventSource(stateID: .hidSystemState)

func post(_ type: CGEventType, _ x: Double, _ y: Double, _ pressure: Double) {
    let point = CGPoint(x: x, y: y)
    guard let event = CGEvent(mouseEventSource: source, mouseType: type,
                              mouseCursorPosition: point, mouseButton: .left) else { return }
    event.setDoubleValueField(.mouseEventPressure, value: pressure)
    event.post(tap: .cghidEventTap)
}

let points = payload.points
post(.mouseMoved, points[0][1], points[0][2], 0)
usleep(30_000)
post(.leftMouseDown, points[0][1], points[0][2], 0.5)

var previous = points[0][0]
for point in points.dropFirst() {
    let delta = point[0] - previous
    previous = point[0]
    if delta > 0 { usleep(useconds_t(max(delta, 0) * 1000)) }
    post(.leftMouseDragged, point[1], point[2], 0.5)
}

usleep(20_000)
let last = points[points.count - 1]
post(.leftMouseUp, last[1], last[2], 0)
