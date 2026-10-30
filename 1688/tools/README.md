# 本地工具

本目录包含两类工具：**本地计算并发送验证请求**（`pp_local_send.py`），以及对已有采集文件做离线复验的诊断脚本。

完整背景、参数来源与验证边界见 [`docs/x5sec.md`](../docs/x5sec.md)。

## 主入口：本地计算 + 本地发送

浏览器只负责打开挑战页和采集人工拖拽事件；`bx-pp` 由本地归档 VM 计算，验证请求由本地 Node 发出。

~~~bash
# 端到端（需要人工拖动滑块）
uv run --project 1688 python 1688/tools/pp_local_send.py --new

# 使用已有挑战文件
uv run --project 1688 python 1688/tools/pp_local_send.py \
  --challenge .playwright-cli/challenge_live_captcha.json

# 对照组：浏览器自己发，只比对参数
uv run --project 1688 python 1688/tools/pp_local_send.py --new --mode browser

# 离线自检（不联网、不开浏览器）
uv run --project 1688 python 1688/tools/pp_local_send.py \
  --self-test .playwright-cli/pp_vm_capture_captchacapslidev2.json
~~~

- `pp_local_send.py`：环境准备与结果解析；自动设置 `NODE_PATH`（`npm root -g`）。
- `pp_local_send.cjs`：Playwright 实现。启动时校验 VM needle 与 `punish-inline-vm.js` / `punish-program.wasm` 的 SHA-256，不匹配退出码 2。
- 退出码：`0` 表示 `local` 模式下 `result.code === 0`；`1` 失败；`2` 环境或版本不匹配。

前提：`navigator.webdriver` 必须为 `false`。Playwright 默认注入 `--enable-automation` 会导致验证返回 `code=300`。

## 离线复验（已有采集文件）

~~~bash
uv run --project 1688 python 1688/tools/verify_dynamic_capture.py .playwright-cli/<capture>_capture.json
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 --capture .playwright-cli/<capture>_capture.json --summary
uv run --project 1688 python 1688/tools/diff_nonce_trace.py .playwright-cli/<capture>_capture.json --summary
~~~

- `verify_dynamic_capture.py`：用同一份捕获数据重算 FY、nonce、ET，给出长度、相等性和首个差异位置。
- `diff_fy_trace.py`：逐层对照 FY 执行轨迹。serializer-replay 是诊断模式，会把浏览器记录的序列化字节作为输入，不能当作本地独立复算成功。
- `diff_nonce_trace.py`：对照 nonce VM 调用和环境值。
- `diff_environment.py`：检查样本中的浏览器环境记录。
- `render_nonce_svg.py`：离线处理 nonce 使用的 SVG 输入。
- `core/x5sec/runtime/`：供本地归档脚本回放使用；当前部分参数仍由 Python 调用归档 JavaScript 或 WASM，并非纯 Python 实现。

这些脚本要求输入文件是对应工具生成的完整采集 JSON。不同题目不能直接逐值比较；随机数、时间、事件和页面状态都属于样本输入。

## 已验证结果

2026-10-30，`captcha`（`/slide`）：

- 注入浏览器 track 时，本地 `ppSign` 与浏览器逐字节相等（564/564）。
- 不注入 track（VM 自算）时内容不同，但服务端返回 `code=0` 并下发 `x5sec`。
- 请求由本地 Node `https` 发出，同样 `code=0`。

2026-10-22，`captchacapslidev2` 离线复验：浏览器与本地的 FY、nonce、ET、PP 及最终请求 URL 相等（FY 201 条事件、nonce 160 字符、ET 469 字符）。该结果只证明同输入重放一致，服务端未验证。

历史结论中"本地请求返回 300"的记录来自未修复 `navigator.webdriver` 的采集环境，不代表参数不可用。

## 数据保护

`.playwright-cli/` 下的采集文件可能含 Cookie、挑战令牌、动态参数和页面数据。它们只用于本机的授权样本复验，不要提交、分享或复制到日志。提交前检查 `git status` 和完整 diff，确认没有采集文件或凭据。

运行任何采集脚本前应先审阅其副作用，并仅在获授权的自有测试环境中使用。
