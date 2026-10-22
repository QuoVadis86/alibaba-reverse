# x5sec 动态参数复验与版本更新手册

本手册记录 `captchacapslidev2` 分支的可重复验证方法。目标是让下一次脚本更新时，能够从浏览器实际提交的请求重新找到写出点，定位第一个差异，再恢复本地同输入计算。浏览器交互统一使用 Playwright。滑块故意拖错即可；参数是否算对以同一道题的浏览器与本地完整字符串逐字节相等为准。

## 当前结论与边界

| 参数 | 当前证据 | 实现边界 |
| --- | --- | --- |
| `ppSign` / `bx-pp` | 新题中归档 VM、WASM 与浏览器同输入逐字节一致，实际请求头也核对过 | Python 调用归档 JS/WASM，动态轨迹仍需同题输入 |
| `bx-et` | 三道新题中本地与浏览器目标调用的完整字符串和编码前载荷一致 | 依赖初始化状态和调用时环境回放 |
| nonce / `_rand` | 两道新题的最终滑动阶段均为 160 字符且逐字节一致 | 依赖 Worker、Canvas、事件与时钟等同题输入 |
| FY / `ua` | 两道新题的拖动前基线和拖动后结果均逐字节一致；已用 52 条事件的错误拖动独立复验 | Python 调用归档 JS VM，字体、时间、调用栈等仍取自浏览器采样 |

这些结果证明**同题、同输入的算法路径**。它们不证明能独立产生正确滑块距离、不依赖浏览器采样生成全部环境值，或已经完成纯 Python 移植。不要把验证接口的 `code=0` 当成算法还原的必要条件，也不要把“长度相同”当成逐字节一致。

## 代码与资料入口

| 用途 | 位置 |
| --- | --- |
| 获取指定类型挑战 | [`tools/get_challenge.py`](../tools/get_challenge.py) |
| Playwright 采集与三参数重放 | [`tools/capture_dynamic.py`](../tools/capture_dynamic.py)、[`tools/dynamic_capture.js`](../tools/dynamic_capture.js) |
| FY 同题差异报告 | [`tools/diff_fy_trace.py`](../tools/diff_fy_trace.py) |
| nonce 与环境差异报告 | [`tools/diff_nonce_trace.py`](../tools/diff_nonce_trace.py)、[`tools/diff_environment.py`](../tools/diff_environment.py) |
| 本地浏览器环境和归档 JS 执行 | [`core/x5sec/runtime/js_runtime.cjs`](../core/x5sec/runtime/js_runtime.cjs) |
| ET、nonce 的可复用插桩片段 | [`tools/probes/`](../tools/probes/) |
| 归档脚本与原始参考 | [`core/x5sec/assets/`](../core/x5sec/assets/)、[`docs/reference/`](reference/) |
| 请求组装与处罚页参数 | [`core/x5sec/scratch_params.py`](../core/x5sec/scratch_params.py)、[`core/x5sec/pp.py`](../core/x5sec/pp.py) |

`core/x5sec/assets/et_f.js` 对应参考目录中 `et_f-1.83.8.js.raw.txt` 的原始内容（工作文件去掉末尾换行）；不要拿另一份经过处理的同名版本替换后还认为字节码位置不变。FY 归档脚本也是核对浏览器源内容后才用于重放。任何新版都先确认实际加载的 URL、内容哈希和大小，再判断是版本变化还是环境差异。

## 复验命令

在仓库根目录执行：

```bash
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 --summary
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 --capture .playwright-cli/fy_trace_current.json --summary
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 > .playwright-cli/fy_report.json
```

第一条取得新题并由 Playwright 重放拖动；第二条复用同一份采样，只重跑本地代码；第三条保存含 VM 检查点的完整报告。`--summary` 只显示一致性、长度和事件数。采集与完整报告包含 Cookie、挑战令牌、参数和可能的页面数据，必须留在被忽略的 `.playwright-cli/`，不要提交。完成一次采集后，先复用它定位本地差异；修复后再取新题做独立复验。

## 从输出倒推的检查点

1. **最终写出**：记录 `/newslidevalidate` 的查询串、`bx-et`、`bx-pp`、FY `ua`、`umidToken`、nonce `_rand`，以及实际发送时的顺序。把“本地函数输出”与“请求真正使用的值”分别核对。
2. **调用入口**：拖动开始前的 `FYModule.fyObj.startRecord()`、FY `getFYToken()` / `getUidToken()`，以及 ET、nonce、`ppSign` 的目标签名调用。保留前置调用和初始化顺序；只重放最终函数的显式参数会漏状态。
3. **算法输入**：同一道题的配置、随机数、`Date` / `performance` 读数、Cookie 阶段、Canvas/WebGL、Worker 回调、DOM 属性和事件序列。轨迹保存在采集的 `events` 中，接口留给以后替换成自生成轨迹。
4. **编码前状态**：先比 VM 路径、特征对象、原始字节或 JSON，再比最终字符串。首次分叉的位置比尾部加密结果更有用；不要把浏览器最终参数直接作为本地返回值。

FY 的序列化前特征 11 是拖动记录数组，52 是调用栈文本，77 含页面时钟差值。此前 52 条事件已经到齐，但特征 11 的首条数据仍不同；追到鼠标移动路径读取 `document.body.scrollTop/scrollLeft`，浏览器返回 `0`，本地曾返回 `undefined`。按下事件里的时间读数相差数毫秒，会让虚拟机 `% 7` 选择不同值。当前工具从浏览器 **读取点** 采集日期和栈帧，作为环境输入重放；若新版再次分叉，应重新核对这些读取点，而不是硬填特征值。

## 新版本的排查顺序

1. **先锁版本**：抓实际页面加载的脚本内容，与归档资产比较哈希、长度和加载顺序。插桩会改变脚本列号，不能拿插桩后的绝对列号当稳定标识。
2. **固定同题输入**：采集一次错误拖动，记录初始化、前置 FY/UID 调用、拖动事件和目标签名。先跑拖动前基线，再跑拖动后结果。不同挑战的随机数、曲线和页面状态不能直接比较。
3. **缩小首个分叉**：从完整报告按“最终输出 → 序列化输入 → 特征写入 → VM 分支 → 环境读取”回溯。环境快照相等只说明已采样的属性一致，不代表对象原型、调用副作用和未采样状态一致。
4. **分开补环境与改算法**：浏览器原生对象的类型、原型、描述符、异常和时钟行为先按读取点补；只有两边输入及 VM 路径相同仍得不同中间值时，才怀疑脚本版本或算法实现。字体宽度、Canvas 像素和调用栈不能靠固定常量跨题复用。
5. **两次验证**：修复后先对缓存采样逐字节相等，再采两道新题复验。报告长度、首次差异、轨迹事件数、资产是否一致；不要用滑块过关代替这一检查。

旧调查过程见 [`x5sec-scratch-2026-10-20.md`](x5sec-scratch-2026-10-20.md)。其中按日期记录的不一致结论是当时状态，当前状态以本手册和新采样报告为准。
