"""人工拖拽轨迹生成。

给定起点与终点，生成一条带时间戳的指针轨迹，用于替换真人拖动。

模型来自对 5 条真人滑块拖动的统计（`tools/collect_trajectory.cjs` 采集）：

- 一次拖动由 **1–3 段**子动作组成，段间有 30–150 ms 停顿；
- 每段内部接近**最小加加速度**（minimum-jerk）速度曲线；
- 采样间隔约 **7 ms**（p95 11–31 ms）；
- 滑块是受约束的一维任务，路径效率 0.997–0.999，几乎没有横向偏移；
- 250–300 px 距离的拖动时长中位数约 **900 ms**。

所有随机性由 ``seed`` 控制，同参数同种子输出逐点一致。
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Point:
    """一个采样点；``t_ms`` 相对轨迹起点。"""

    t_ms: float
    x: float
    y: float
    buttons: int = 1


@dataclass(frozen=True, slots=True)
class Constraints:
    """轨迹约束；默认值取自真人样本的中位区间。"""

    seed: int = 0
    sample_hz: float = 143.0
    jitter_px: float = 0.08
    curve_px: float = 0.0
    pause_min_ms: float = 30.0
    pause_max_ms: float = 150.0
    fitts_a: float = 0.35
    fitts_b: float = 0.18
    target_width_px: float = 40.0
    min_duration_ms: float = 450.0
    max_duration_ms: float = 1600.0
    duration_jitter: float = 0.12


_SEGMENT_WEIGHTS = ((1, 0.20), (2, 0.50), (3, 0.30))


def fitts_duration_ms(distance_px: float, constraints: Constraints) -> float:
    """Fitts 定律给出的基准时长（毫秒）。"""
    index = math.log2(max(distance_px, 1.0) / max(constraints.target_width_px, 1.0) + 1.0)
    return (constraints.fitts_a + constraints.fitts_b * index) * 1000.0


def _minimum_jerk(tau: float) -> float:
    return tau * tau * tau * (10.0 - 15.0 * tau + 6.0 * tau * tau)


def _choose_segments(rng: random.Random) -> int:
    roll = rng.random()
    total = 0.0
    for count, weight in _SEGMENT_WEIGHTS:
        total += weight
        if roll <= total:
            return count
    return _SEGMENT_WEIGHTS[-1][0]


def _distance_fractions(count: int, rng: random.Random) -> list[float]:
    """每段覆盖剩余距离的比例；最后一段补满。"""
    if count == 1:
        return [1.0]
    if count == 2:
        first = rng.uniform(0.60, 0.85)
        return [first, 1.0 - first]
    first = rng.uniform(0.45, 0.70)
    second = rng.uniform(0.60, 0.90)
    return [first, (1.0 - first) * second, (1.0 - first) * (1.0 - second)]


def generate(
    start: tuple[float, float],
    end: tuple[float, float],
    constraints: Constraints | None = None,
) -> list[Point]:
    """生成从 ``start`` 到 ``end`` 的拖拽轨迹。"""
    constraints = constraints or Constraints()
    rng = random.Random(constraints.seed)
    x0, y0 = start
    x1, y1 = end
    dx, dy = x1 - x0, y1 - y0
    distance = math.hypot(dx, dy)
    if distance < 1.0:
        return [Point(0.0, x0, y0), Point(16.0, x1, y1)]

    count = _choose_segments(rng)
    fractions = _distance_fractions(count, rng)
    pauses = [rng.uniform(constraints.pause_min_ms, constraints.pause_max_ms)
              for _ in range(count - 1)]
    pause_total = sum(pauses)

    base_ms = fitts_duration_ms(distance, constraints)
    base_ms *= rng.uniform(1.0 - constraints.duration_jitter, 1.0 + constraints.duration_jitter)
    total_ms = min(max(base_ms, constraints.min_duration_ms), constraints.max_duration_ms)
    travel_ms = max(total_ms - pause_total, constraints.min_duration_ms * 0.4)

    # 每段时长按距离的 0.7 次方分配，避免远段被压得过短。
    weights = [max(f, 1e-3) ** 0.7 for f in fractions]
    weight_sum = sum(weights)
    segment_ms = [travel_ms * w / weight_sum for w in weights]

    unit_x, unit_y = dx / distance, dy / distance
    normal_x, normal_y = -unit_y, unit_x
    curve = rng.uniform(-1.0, 1.0) * constraints.curve_px

    points: list[Point] = [Point(0.0, x0, y0, 1)]
    elapsed = 0.0
    travelled = 0.0

    for index, (fraction, duration) in enumerate(zip(fractions, segment_ms)):
        segment_start = travelled
        segment_distance = distance * fraction
        steps = max(int(round(duration / (1000.0 / constraints.sample_hz))), 2)
        for step in range(1, steps + 1):
            tau = step / steps
            elapsed += duration / steps * rng.uniform(0.85, 1.15)
            progress = segment_start + segment_distance * _minimum_jerk(tau)
            arc = math.sin(math.pi * (progress / distance)) * curve
            x = x0 + unit_x * progress + normal_x * arc + rng.gauss(0.0, constraints.jitter_px)
            y = y0 + unit_y * progress + normal_y * arc + rng.gauss(0.0, constraints.jitter_px)
            points.append(Point(elapsed, x, y, 1))
        travelled = segment_start + segment_distance
        if index < len(pauses):
            elapsed += pauses[index]
            last = points[-1]
            points.append(Point(elapsed, last.x, last.y, 1))

    # 收尾对齐到终点，并补一条抬起事件。
    elapsed += rng.uniform(10.0, 25.0)
    points.append(Point(elapsed, x1, y1, 0))
    return points


def vm_events(points: list[Point]) -> list[dict[str, float | int]]:
    """把轨迹压成处罚页 VM 需要的少量事件（按下 / 采样移动 / 抬起）。"""
    if not points:
        return []
    body = points[1:-1] or points[:-1]
    if len(body) >= 3:
        sampled = [body[int(i * (len(body) - 1) / 2)] for i in range(3)]
    else:
        sampled = body
    events = [{"type": "pointerdown", "x": points[0].x, "y": points[0].y,
               "t_ms": points[0].t_ms, "buttons": 1}]
    events.extend({"type": "pointermove", "x": p.x, "y": p.y,
                   "t_ms": p.t_ms, "buttons": 1} for p in sampled)
    events.append({"type": "pointerup", "x": points[-1].x, "y": points[-1].y,
                   "t_ms": points[-1].t_ms, "buttons": 0})
    return events


def stats(points: list[Point]) -> dict[str, float]:
    """轨迹的常用统计量，用于与真人样本对比。"""
    if len(points) < 3:
        return {"duration_ms": 0.0, "points": float(len(points))}
    duration = points[-1].t_ms - points[0].t_ms
    path = sum(math.hypot(b.x - a.x, b.y - a.y) for a, b in zip(points, points[1:]))
    straight = math.hypot(points[-1].x - points[0].x, points[-1].y - points[0].y)
    speeds = [
        math.hypot(b.x - a.x, b.y - a.y) / max((b.t_ms - a.t_ms) / 1000.0, 1e-6)
        for a, b in zip(points, points[1:])
    ]
    return {
        "duration_ms": round(duration, 1),
        "points": float(len(points)),
        "path_px": round(path, 1),
        "straight_px": round(straight, 1),
        "efficiency": round(straight / path, 4) if path else 0.0,
        "peak_speed_px_s": round(max(speeds), 1) if speeds else 0.0,
        "mean_speed_px_s": round(sum(speeds) / len(speeds), 1) if speeds else 0.0,
    }


# ---------------------------------------------------------------------------
# 模板变形：直接复用真人轨迹的形状
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Template:
    """一条真人轨迹的归一化形状。"""

    times: tuple[float, ...]      # 归一化时间 0..1（单调不减）
    progress: tuple[float, ...]   # 归一化进度 0..1（单调不减）
    duration_ms: float
    distance_px: float


def load_templates(path: str) -> list[Template]:
    """从 `collect_trajectory.cjs` 的输出读取真人模板。"""
    import json

    with open(path, encoding="utf-8") as handle:
        payload = json.load(handle)

    templates: list[Template] = []
    for sample in payload.get("samples", []):
        events = sample.get("events", [])
        down = next((e for e in events if e["type"] == "pointerdown"), None)
        up = next((e for e in events if e["type"] == "pointerup"), None)
        if down is None or up is None:
            continue
        moves = [e for e in events
                 if e["type"] == "pointermove" and down["t"] <= e["t"] <= up["t"]]
        if len(moves) < 8:
            continue
        x0, y0 = moves[0]["x"], moves[0]["y"]
        x1, y1 = moves[-1]["x"], moves[-1]["y"]
        distance = math.hypot(x1 - x0, y1 - y0)
        if distance < 20.0:
            continue
        unit_x, unit_y = (x1 - x0) / distance, (y1 - y0) / distance
        start_t = down["t"]
        span = max(up["t"] - start_t, 1.0)
        times: list[float] = []
        progress: list[float] = []
        for event in moves:
            times.append((event["t"] - start_t) / span)
            projected = (event["x"] - x0) * unit_x + (event["y"] - y0) * unit_y
            progress.append(min(max(projected / distance, 0.0), 1.0))
        # 强制单调，消除噪声导致的回退。
        for index in range(1, len(progress)):
            progress[index] = max(progress[index], progress[index - 1])
        # 归一化到 [0, 1]：真人第一个采样点常常已经在起点前方，
        # 若直接 clamp 会在轨迹开头造成一段"不动"的死区。
        low, high = progress[0], progress[-1]
        span = max(high - low, 1e-6)
        progress = [(value - low) / span for value in progress]
        templates.append(Template(tuple(times), tuple(progress),
                                  up["t"] - start_t, distance))
    return templates


def generate_like(
    template: Template,
    start: tuple[float, float],
    end: tuple[float, float],
    constraints: Constraints | None = None,
) -> list[Point]:
    """按模板形状生成新轨迹：时间与距离做小幅变形，形状保持不变。"""
    constraints = constraints or Constraints()
    rng = random.Random(constraints.seed)
    x0, y0 = start
    x1, y1 = end
    distance = math.hypot(x1 - x0, y1 - y0)
    if distance < 1.0:
        return [Point(0.0, x0, y0), Point(16.0, x1, y1)]

    scale = (distance / max(template.distance_px, 1.0)) ** 0.25
    duration = template.duration_ms * scale * rng.uniform(0.88, 1.12)
    duration = min(max(duration, constraints.min_duration_ms), constraints.max_duration_ms)

    unit_x, unit_y = (x1 - x0) / distance, (y1 - y0) / distance
    interval = 1000.0 / constraints.sample_hz
    points: list[Point] = [Point(0.0, x0, y0, 1)]
    elapsed = 0.0
    cursor = 0
    last_progress = 0.0
    while elapsed < duration:
        elapsed += interval * rng.uniform(0.8, 1.25)
        ratio = min(elapsed / duration, 1.0)
        while cursor + 1 < len(template.times) and template.times[cursor + 1] < ratio:
            cursor += 1
        if cursor + 1 >= len(template.times):
            progress = 1.0
        else:
            t0, t1 = template.times[cursor], template.times[cursor + 1]
            weight = 0.0 if t1 <= t0 else (ratio - t0) / (t1 - t0)
            progress = template.progress[cursor] + (template.progress[cursor + 1] - template.progress[cursor]) * weight
        # 停顿期间进度不变，真人在此期间不产生移动事件。
        if progress - last_progress < 0.0008:
            continue
        last_progress = progress
        travelled = distance * min(max(progress, 0.0), 1.0)
        x = x0 + unit_x * travelled + rng.gauss(0.0, constraints.jitter_px)
        y = y0 + unit_y * travelled + rng.gauss(0.0, constraints.jitter_px)
        points.append(Point(elapsed, x, y, 1))

    elapsed += rng.uniform(10.0, 25.0)
    points.append(Point(elapsed, x1, y1, 0))
    return points
