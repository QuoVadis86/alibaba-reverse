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
