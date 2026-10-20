# FY 模块：`n` 与 `umidToken`

本记录只依据 2026-10-20 的 [JS 样本](reference/README.md) 和同次成功请求。目标是判断 FY 输出是否已有足够证据移植到 Python。

## 调用链

1. `punishpage-0.1.129.js` 将 `AWSC_SPECIFY_FYMODULE_ADDRESSES.normalAddresses` 设为 `https://o.alicdn.com/seclab/f/index1.js`，覆盖 AWSC 的默认 FY 地址。
2. `nc-1.97.2.js` 创建 `__fy_options`，调用 `AWSC.configFYEx(callback, options, 1000)`。
3. `awsc-captcha-0.0.1.js` 加载 FY 模块，执行 `fyObj.init(options, callback)`；初始化完成后，`getFYToken(options)` 和 `getUidToken(options)` 才代理到 FY 对象。未加载或未初始化时返回带 `defaultFY` 的回退字符串。
4. 拖动开始时，`nc.js` 调用 `fyObj.startRecord()`；提交前调用 `getFYToken(options)` 得到 `slidedata.n`，调用 `getUidToken()` 得到 `p.umidToken`。

本次 `__fy_options` 的默认值为：

```json
{"MaxMTLog":300,"MTInterval":4,"MinMTDwnLog":30,"MaxKSLog":14,"MaxFocusLog":6,"MaxNGPLog":200,"NGPInterval":4,"Enable":3,"location":"cn","_umopt_npfp":1}
```

`location` 由组件的 `foreign` 选项选择 `cn` 或 `us`；上面是本次请求的 `cn` 分支。配置项名称暗示鼠标移动、按下、键盘和焦点记录上限，但具体字段语义尚未在 FY 内部证实。

## 已观察到的输出

| 值 | 本次样本结构 | 可确认的边界 |
| --- | --- | --- |
| `slidedata.n` | 1976 字符，以 `234!` 开头；后 1972 字符可按标准 Base64 解成 1479 字节。 | 前缀含义未知；解码后的字节不是已识别的明文格式。 |
| `p.umidToken` | 68 字符，按 URL-safe Base64 解码为 50 字节。 | 生成输入和字节布局未知。 |

上述长度、前缀和编码只来自一次成功请求，不应当作固定协议。`n` 解码后字节的样本熵约为 7.86 bit/byte，符合压缩或加密数据的外观；这不能单独证明使用了哪种算法。

## Python 移植状态

页面和 NC 层的参数组装已由 [`slide_params.py`](../mtop_sdk/slide_params.py) 复现。使用同次请求的动态值和 DOM 几何值离线对照，`ncSessionID`、`slidedata` 和完整查询串均与抓包逐字节相同。

FY 内部生成逻辑尚未移植。`index1.js` 约 583 KB，AST 中有 214 个 `switch` 和约 5.7 万次动态属性访问；明文源码中没有 `getFYToken`、`getUidToken` 或 `startRecord` 标识符。原始文件可被 Babel 解析，但通用 AST 流水线的首次标准化产物出现重复声明错误；即使修复该步骤，也仍需还原虚拟机指令与输入状态。当前没有足够证据写出可验证的纯 Python 令牌生成器。

下一步需要先确定 FY 导出方法对应的字节码入口，再取得输入快照：初始化配置、浏览器环境字段、拖动事件序列，以及输出前的原始 payload。只有输入和编码前数据能够与同一请求对齐，才适合移植编码或加密部分。
