# 本地诊断工具

本页只记录对已有采集文件执行的离线分析命令。命令不会获取新挑战，也不会向外部验证接口发送请求。

## 离线复验

在仓库根目录运行：

~~~bash
uv run --project 1688 python 1688/tools/verify_dynamic_capture.py .playwright-cli/<capture>_capture.json
uv run --project 1688 python 1688/tools/diff_fy_trace.py captchacapslidev2 --capture .playwright-cli/<capture>_capture.json --summary
uv run --project 1688 python 1688/tools/diff_nonce_trace.py .playwright-cli/<capture>_capture.json --summary
~~~

- verify_dynamic_capture.py：用同一份捕获数据重算 FY、nonce、ET，给出长度、相等性和首个差异位置，并检查 nonce SVG 与摘要输入。
- diff_fy_trace.py：逐层对照已有样本的 FY 执行轨迹。serializer-replay 是诊断模式，会把浏览器记录的序列化字节作为输入，不能当作本地独立复算成功。
- diff_nonce_trace.py：对照已有样本的 nonce VM 调用和环境值。
- diff_environment.py：检查已有样本中的浏览器环境记录。
- render_nonce_svg.py：离线处理 nonce 使用的 SVG 输入。
- core/x5sec/runtime/：供本地归档脚本回放使用；当前部分参数仍由 Python 调用归档 JavaScript 或 WASM，并非纯 Python 实现。

这些脚本要求输入文件是对应工具生成的完整采集 JSON。不同题目不能直接逐值比较；随机数、时间、事件和页面状态都属于样本输入。

## 最新离线结果

2026-10-22 的一份人工轨迹样本中，浏览器与本地的 FY、nonce、ET、PP 及最终请求 URL 相等。FY 拖动目标调用使用 201 条事件；完整采集共记录 232 条事件。nonce 输出为 160 字符，SVG 原文和摘要输入检查点相等；ET 输出为 469 字符。该结果证明这份样本的同输入重放一致，不代表所有挑战都一致，也不代表无需浏览器采样即可生成全部输入。

该样本的线上请求结果不是离线算法判据。浏览器页面出现失败提示，是采集页拦截流程返回模拟失败结果；单独发出的本地请求返回 HTTP 200、业务码 300，未获得 x5sec。两者是不同请求结果，不能用来推翻上述逐项相等结果，也不能由它们推断哪个算法字段有错。

历史差异与排查结论见[动态参数复验记录](../docs/x5sec-reverse-playbook.md)。

## 数据保护

.playwright-cli/ 下的采集文件可能含 Cookie、挑战令牌、动态参数和页面数据。它们只用于本机的授权样本复验，不要提交、分享或复制到日志。提交前检查 git status 和完整 diff，确认没有采集文件或凭据。

目录中还保留有采集和网络诊断脚本；运行前应先审阅其副作用，并仅在获授权的自有测试环境中使用。本页不提供对外部站点发起挑战或验证请求的操作步骤。
