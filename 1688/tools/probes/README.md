# 运行时探针

本目录的 `.txt` 和 `.js` 文件是仍在使用的插桩源码，由 `capture_dynamic.py` 注入 Playwright 页面，或由 `core/x5sec/runtime/js_runtime.cjs` 在本地回放时读取。它们不是采集结果，也不含某一道题的令牌。

| 文件 | 用途 |
| --- | --- |
| `et_pc_probe.txt`、`et_w_probe.txt` | ET VM 执行位置和初始化指纹检查点 |
| `nonce_lt_probe.txt`、`nonce_mt_probe.txt`、`nonce_tt_probe.txt` | nonce 属性读取、写入和计时检查点 |
| `nonce_dispatch_probe.txt`、`nonce_jn_probe.txt`、`nonce_memory_probe.txt` | nonce 分发、注册和内部内存检查点 |
| `environment_snapshot.js` | 浏览器与本地同路径环境快照 |

脚本更新时，先核对新源码中的插桩锚点，再调整这些片段；锚点不存在时采集器应报错，不能静默跳过。定位流程见 [`docs/x5sec.md`](../../docs/x5sec.md)。
