"""生成拖拽轨迹。

有两种模式：

- **模板模式**（推荐）：读取 `collect_trajectory.cjs` 采集的真人样本，按模板形状做
  时间/距离变形，统计特征与真人一致。
- **参数模式**：没有模板时的回退，使用 Fitts 时长 + 分段最小加加速度。

用法：

    uv run --project 1688 python 1688/tools/gen_trajectory.py \
        --templates .playwright-cli/human_traj.json --start 492,502 --end 746,502 --seed 7
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.x5sec.trajectory import (  # noqa: E402
    Constraints,
    generate,
    generate_like,
    load_templates,
    stats,
    vm_events,
)


def _point(value: str) -> tuple[float, float]:
    x, y = value.split(",")
    return float(x), float(y)


def main() -> int:
    parser = argparse.ArgumentParser(description="生成人工风格拖拽轨迹")
    parser.add_argument("--start", type=_point, required=True, help="起点 x,y")
    parser.add_argument("--end", type=_point, required=True, help="终点 x,y")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--templates", type=Path, help="真人轨迹 JSON（collect_trajectory.cjs 输出）")
    parser.add_argument("--template-index", type=int, help="指定模板序号；默认按 seed 选择")
    parser.add_argument("--out", type=Path, help="轨迹 JSON 输出路径")
    parser.add_argument("--hz", type=float, default=250.0, help="采样率（真人实测约 200–250 Hz）")
    parser.add_argument("--normalized", action="store_true", help="输出 0..1 归一化坐标")
    parser.add_argument("--distance", type=float, default=316.0, help="归一化时用于计算时长的真实距离（px）")
    parser.add_argument("--vm-events", action="store_true", help="同时输出处罚页 VM 需要的少量事件")
    arguments = parser.parse_args()

    constraints = Constraints(seed=arguments.seed, sample_hz=arguments.hz)
    templates = []
    if arguments.templates:
        if not arguments.templates.exists():
            raise SystemExit(f"模板文件不存在: {arguments.templates}")
        templates = load_templates(str(arguments.templates))
        if not templates:
            raise SystemExit("模板文件里没有可用轨迹")

    target_end = (arguments.distance, arguments.end[1]) if arguments.normalized else arguments.end
    if templates:
        index = arguments.template_index if arguments.template_index is not None \
            else arguments.seed % len(templates)
        points = generate_like(templates[index], arguments.start, target_end, constraints)
        mode = f"template#{index}"
    else:
        points = generate(arguments.start, target_end, constraints)
        mode = "parametric"

    if arguments.normalized:
        scale = max(arguments.distance, 1.0)
        points = [type(points[0])(p.t_ms, p.x / scale, p.y / scale, p.buttons) for p in points]

    report = {
        "mode": mode,
        "seed": arguments.seed,
        "start": arguments.start,
        "end": arguments.end,
        "stats": stats(points),
        "points": [[round(p.t_ms, 2), round(p.x, 2), round(p.y, 2), p.buttons] for p in points],
    }
    if arguments.vm_events:
        report["vm_events"] = vm_events(points)

    if arguments.out:
        arguments.out.write_text(json.dumps(report, ensure_ascii=False, indent=1))
    print(json.dumps({k: v for k, v in report.items() if k != "points"}, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
