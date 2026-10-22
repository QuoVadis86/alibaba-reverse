# 挑战采集工具

`get_challenge.py` 只接收链接类型，内部并发请求企业搜索接口，保存挑战链接及对应请求会话 Cookie。链接会过期，使用前重新运行。

```bash
uv run --project 1688 python 1688/tools/get_challenge.py captcha
uv run --project 1688 python 1688/tools/get_challenge.py captchacapslidev2
```

工具每批发起 36 次请求、最多 24 个并发，未拿到指定类型时最多重试 5 批。结果写入仓库中被忽略的 `.playwright-cli/challenge_<类型>.json`。命令行只打印链接和文件路径；文件中的 `cookies` 可供 Playwright 注入会话，勿提交到仓库。

`get_challenge.py` 只负责取得链接，不会操作浏览器。打开挑战页及交互仍使用 Playwright。

## 处罚页 `ppSign` VM 复验

`capture_pp_vm.py` 取得新的 `captchacapslidev2` 题，使用 Playwright 打开页面并故意拖到错误位置。在 VM 编码函数入口记录轨迹输入，再由 Python 调用本地归档 JS 与 WASM 计算 `ppSign`，比较两边完整字符串。

```bash
uv run --project 1688 python 1688/tools/capture_pp_vm.py captchacapslidev2
```

命令输出 `equal`、`headerEqual`、两边长度和采集文件路径；`headerEqual` 比较实际验证请求头 `bx-pp`。采集 JSON 写入被忽略的 `.playwright-cli/pp_vm_capture_captchacapslidev2.json`，包含挑战令牌与签名，不要提交。`core/x5sec/pp.py` 提供 `generate_pp_sign(page, init_commands, drag_calls, track=...)`；省略 `track` 时由本地 VM 自行生成轨迹编码，传入浏览器 VM 断点记录的轨迹可对齐含时间变化的输入。该函数由 Python 调用 `core/x5sec/runtime/pp_vm_runtime.cjs` 执行归档 VM 和 WASM，`tools/pp_vm.py` 负责比较采集结果。

## FY、nonce、ET 同题对照

`capture_dynamic.py` 获取新的 `captchacapslidev2` 题，使用 Playwright 故意拖错位置，记录三种动态函数的实际调用输入、随机数和时间调用，以及验证请求头。工具用同一份输入驱动本地归档脚本，输出完整字符串是否相等、长度和首次不同位置。错误的滑动位置不影响这项算法对照。

```bash
uv run --project 1688 python 1688/tools/capture_dynamic.py captchacapslidev2 --startup-trace --trace-et-pc
```

`--trace-et-pc` 记录 ET 初始化和目标签名调用的虚拟机执行位置、指纹、编码前载荷及调用内 `new Date()` 时间。`--break-et` 额外使用 Playwright CDP 函数断点。`--startup-trace` 会包裹全局随机数和时间函数，可能改变浏览器的反调试路径，不能把该模式的输出当作未插桩基线。采集命令结束时会关闭自己创建的 Playwright 会话。

ET 与 nonce 的插桩片段集中在 [`probes/`](probes/)；这些文件由采集器和本地运行时读取，更新脚本版本时可定位同一读取点。目录中的 `environment_snapshot.js` 负责环境快照，`render_nonce_svg.py` 参与 nonce 的 SVG 回放。

采集文件写入被忽略的 `.playwright-cli/dynamic_capture_<类型>_et_vm.json` 等路径，包含请求 URL、Cookie 和参数，只供本地复验，勿提交。工具只比较算法输出，不要求滑块验证成功。

## FY 同题差异定位

```bash
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 --summary
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 --capture .playwright-cli/fy_trace_current.json --summary
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 > .playwright-cli/fy_report.json
```

第一条命令取得新挑战并使用 Playwright 拖到错误位置，简要报告逐字节一致性、长度和轨迹事件数；第二条复用同一采集，不再打开浏览器；第三条保存完整诊断报告。工具默认插入 FY VM 分支探针，记录初始化、拖动前探针、实际拖动调用及此前题目请求调用，并重放浏览器采集的鼠标事件。轨迹输入保留为 `events`，后续可替换为自行生成的轨迹。采集文件和完整报告含令牌、Cookie 与 FY 值，只保存在被忽略的 `.playwright-cli/` 中。

两道新题的拖动后 FY 值已经在同输入下逐字节相等，拖动前基线也相等。当前重放使用归档 JS VM，并把浏览器读到的字体宽度、日期和调用栈等环境值作为输入；这证明同题算法路径对齐，不代表无需浏览器采样的独立纯 Python 生成器已经完成。拖动位置是否正确不影响该对照。

新版本的首个差异定位、关键特征与复验顺序见[动态参数复验手册](../docs/x5sec-reverse-playbook.md)。

## nonce VM 与环境差异定位

```bash
uv run --project 1688 python 1688/tools/capture_dynamic.py captchacapslidev2 --startup-trace --trace-nonce-gt
uv run --project 1688 python 1688/tools/diff_nonce_trace.py .playwright-cli/dynamic_capture_captchacapslidev2_startup_nonce_gt.json --summary
```

第二个命令复用第一步采集的同题输入，在本地重放 nonce VM。默认自动回放快照里的确定性环境值；`--no-auto-env` 给出补齐前基线。报告列出首次 VM 调用编号分叉、首次句柄注册调用点分叉、各阶段输出差异、Worker 与图片加载情况、Canvas 摘要输入长度及哈希，以及环境值和描述符差异。`--limit 0` 显示全部环境差异；`--replay-digest` 可用浏览器摘要结果隔离下游分支，仅供定位，不代表本地已还原 Canvas。轨迹采集会插桩浏览器脚本，仅用于定位；改动环境后可对同一采集文件反复本地重放。

手动补齐环境后，两道新题的最终滑动阶段 nonce 已在同输入下逐字节相等。采集命令的 `comparison` 中 `label=nonce`、`equal=true` 是这一项的检查结果。运行时按快照回放各阶段 Worker 消息数量、动画帧时间、鼠标屏幕坐标和窗口属性；这仍是归档 JS VM 的同题重放，不是无需页面快照的独立生成器。
