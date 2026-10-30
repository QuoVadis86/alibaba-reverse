# 1688 x5sec 滑块校验：参数、模块与本地管线

本文是 x5sec 相关的唯一说明文档，替代此前分散的 `x5sec-challenge.md`、`x5sec-reverse-playbook.md`、`x5sec-scratch-2026-10-20.md`、`fy-module-analysis.md`。

相关入口：[`tools/pp_local_send.py`](../tools/pp_local_send.py)（本地计算 + 本地发送）、[`tools/README.md`](../tools/README.md)（全部工具）、[`reference/README.md`](reference/README.md)（JS 样本与哈希）。

所有结论都标注了验证范围。**同输入逐字节相等**只证明本地复现了该样本，不等于服务端一定接受；**服务端 `code=0`** 才证明该次参数可用。

---

## 1. 现状速览

| 能力 | 状态 |
| --- | --- |
| `captcha`（`/slide`）本地算 `bx-pp` | ✅ 与浏览器逐字节相等 |
| `captcha` 本地算 track（不注入浏览器值） | ✅ 与浏览器不同，但服务端接受 |
| 本地 Node 发送验证请求 | ✅ `code=0` + `bx-x5sec` 下发 |
| 浏览器只采集拖拽事件 | ✅ 已跑通 |
| `captchacapslidev2`（`/newslidevalidate`）全链路 | ❌ 未验证（需 nonce/FY/ET/894 字符 `bx-pp`） |
| 自造拖拽曲线 | ❌ 未实现（当前必须真人拖动） |
| 纯 Python（不跑归档 JS/WASM） | ❌ 未完成 |

**唯一已验证通过的链路**：

```
浏览器(人工拖动,只采集事件)
   → 本地 VM 计算 track + ppSign
   → 本地 Node https 发送
   → {"code":0} + Set-Cookie: x5sec=… → 页面跳转 1688 首页
```

---

## 2. 两条链路

| | `/slide` | `/newslidevalidate` |
| --- | --- | --- |
| action | `captcha` 等 | `captchacapslidev2`（刮刮卡） |
| 题目接口 | 无 | `/_____tmd_____/newslidecaptcha` |
| 组件 | `nc.js`（拖到最右） | `scratch-captcha/0.0.59` |
| 动态模块 | PoW + PP VM | PoW + PP VM + **FY + ET + nonce** |
| `bx-pp` 长度 | 564 / 638（随版本） | 724 / 894 / 1230（随版本与状态） |
| 服务端成功判据 | `result.code === 0` + `bx-x5sec` | 同上 |

两条链路的 `bx-pp` 结构相同：

```
hex( PoW 主体 ) | hex( base64(轨迹编码) | 固定 24 字符 )
```

- PoW 主体由公开的 `punishpage.min.js` 写入，已用纯 Python 复现（`pow.py`）。
- 附加段由处罚页内联 VM 写入（`punish-inline-vm.js` + `punish-program.wasm`）。
- 尾部 24 字符在同一样本族内固定，疑似 MAC。

---

## 3. `/slide` 参数与来源

请求：`GET https://h5api.m.1688.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/_____tmd_____/slide`

| 参数 | 来源 | 状态 |
| --- | --- | --- |
| `slidedata` | `punishpage` 对 `nc.js` 的 `t.data` 做 `JSON.stringify`，字段顺序 `a,t,n,p,scene,asyn,lang,v` | 组装已复现（`slide_params.py`） |
| `slidedata.a` | `_config_.NCAPPKEY` | 来自挑战页 |
| `slidedata.t` | `_config_.NCTOKENSTR` | 来自挑战页 |
| `slidedata.n` | `nc.js` 调 `__fy.getFYToken()`，`234!` 前缀 | FY 生成，未纯算 |
| `slidedata.p` | `trans` 对象序列化：`ncbtn`/`umidToken`/`ncSessionID`/`et` | 组装已复现 |
| `p.ncbtn` | 按钮 `getBoundingClientRect()` 按 `x\|y\|width\|height\|top\|bottom\|left\|right` 拼接 | 来自 DOM |
| `p.umidToken` | `__fy.getUidToken()`；源自 `https://ynuf.aliapp.org/w/wu.json` | FY 生成，未纯算 |
| `p.ncSessionID` | 轨道 `offsetWidth/offsetHeight/绝对 left/top` 当 11 进制数转小写 16 进制 | 已复现 |
| `p.et` | `sgnReady` → `"1"`/`"0"` | 已复现 |
| `x5secdata` | `_config_.SECDATA` | 来自挑战页 |
| `ppt` | `program.wasm` 的 `_pp` 计算耗时（ms） | 纯 Python 已实现，耗时随环境 |
| `_rand` | `window.crypto.genRandomValues(slidedata.n)`，由 **nonce 脚本**提供 | 未纯算 |
| `ts` | 提交时 `(new Date).valueOf()` | 已复现 |
| `fireyeVersion` / `pageVersion` | 常量 `1.234.37` / `0.1.129` | 已复现 |
| `v` | `('v=' + Math.random()).replace('.','')` | 形式已复现，值不可预测 |
| `bx-et` 头 | `window.etSign(完整 URL)` | 未纯算 |
| `bx-pp` 头 | `_config_.ppSign`（PoW 主体 + VM 附加段） | **本机已本地复现并被接受** |

`/newslidevalidate` 额外字段：`ua`（FY）、`encryptToken`（同题响应）、`time`（拖动耗时）、`width`、`per=(距离+24)/组件宽`（三位小数）、`_rand`。组装见 `scratch_params.py`。

---

## 4. 模块与归档

运行时实际加载的是 `core/x5sec/assets/`；`docs/reference/` 保留同一份网络响应的原始字节与格式化副本，用于核对。

| 模块 | 归档 | 作用 |
| --- | --- | --- |
| punishpage | `assets/` 与 `reference/punishpage-0.1.129.js` | 页面流程、PoW、`slidedata`、上报 |
| nc | `reference/nc-1.97.2.js` | 滑块组件、`t.data` |
| FY | `assets/fy-index1.js` | `n`、`umidToken`（583 KB VM） |
| ET | `assets/et_f.js` | `bx-et`（`etSign`） |
| nonce | `assets/nonce-payload.js.b64` | `crypto.genRandomValues`、`_rand`（per-challenge 下发） |
| PP VM | `assets/punish-inline-vm.js` + `punish-program.wasm` | `_config_.ppSign` 的写入者 |

版本指纹（网络响应原始字节）：

| 脚本 | SHA-256 |
| --- | --- |
| `punishpage` | `8ed1e0a831f3bfb7c57413cc71c4a5ea995f73e35f5cafb248bf3bcd031c7698` |
| `nc` | `464db7d6539c0b1c323c2b641626b9072026da621c23d29dd85d6a263360a2a9` |
| `fy` | `b735c02928bc1c4fab6121c6d3139f34675e6c24044eae169363e7c32864da62` |
| `et_f` | `0ab55e76a88a3662447e678025d70e9367eb0c0a5d14948440013c3670ad545d` |
| nonce payload | `f1183d28d8e794e8ae3fc1cbb0f24347c7d869394d004bba92b44ec09d357556` |
| PP VM | `aa0db1c9d336bf67fc9adde2d7450b671e100991bd6a00cba57f32171981ccdf` |
| PP WASM | `0f9ce15381dd36741f2b545982f9baa2c4b9cc123be519aae26fe39368dea5bc` |

`nonce payload` 每行是独立 Base64 块，按行解码后拼接；不要整体解码。

---

## 5. 本地管线

```
浏览器（只做两件事：打开挑战页、人工拖动）
   ↓ 采集 page 档案 + initCommands + dragCalls
capture.json
   ↓ 本地 Node VM（core/x5sec/runtime/pp_vm_runtime.cjs）
ppSign
   ↓ 本地 Node https（同 cookie / 同 header，仅替换 bx-pp）
/slide
   ↓
result.code / bx-x5sec
```

### 工具

| 工具 | 作用 |
| --- | --- |
| `tools/pp_local_send.py` | **主入口**：取挑战 → 采集 → 本地算 → 本地发 → 判定 |
| `tools/pp_local_send.cjs` | 上述流程的 Playwright 实现 |
| `core/x5sec/pp.py` | 只算 `ppSign`（`generate_pp_sign`） |
| `core/x5sec/pow.py` | 纯 Python PoW |
| `core/x5sec/slide_params.py` | `/slide` 查询串组装 |
| `core/x5sec/scratch_params.py` | `captchacapslidev2` 查询串组装 |
| `core/x5sec/dynamic.py` | FY / nonce / ET 的归档 JS 回放 |
| `tools/pp_vm_capture.js` / `capture_pp_vm.py` | 旧版采集器（浏览器发请求，仅用于对照） |

### 复现

```bash
# 离线自检（不联网、不开浏览器）
uv run --project 1688 python 1688/tools/pp_local_send.py \
  --self-test .playwright-cli/pp_vm_capture_captchacapslidev2.json

# 端到端：浏览器采集 + 本地发送（需要人工拖动）
uv run --project 1688 python 1688/tools/pp_local_send.py --new

# 对照组：浏览器自己发，只做参数比对
uv run --project 1688 python 1688/tools/pp_local_send.py --new --mode browser
```

---

## 6. 契约

### 输入 schema

`pp_vm_runtime.cjs` 的唯一输入：

```jsonc
{
  "page": {
    "url", "token", "appKey", "x5secdata", "host", "path", "action",
    "pp", "ppSign", "ppt", "cookie", "referrer", "title", "userAgent", "sliderRect"
  },
  "initCommands": ["_$PI", "…"],     // 拖动前采集，每次可能不同
  "dragCalls": [{ "command": "_$Sx", "event": { "type","x","y","timeStamp","buttons","targetRect" } }],
  "track": null                       // null = 由 VM 自行计算（推荐）
}
```

`page.ppSign` 必须是**拖动前**的基础值（PoW 主体），否则会重复追加。

### 版本指纹

`pp_local_send.cjs` 启动时校验 VM needle 与 `pp-inline-vm`/`wasm` 的 SHA-256；不匹配直接退出码 2，不静默继续。

### 确定性

```
track = f(事件, Date 流)     // Math.random 影响可忽略；事件 timeStamp 不参与
```

- 钉死 `Date` 后同一输入多次运行结果一致；不钉死则每次不同。
- 本地自算 track 与浏览器不同是**正常现象**，服务端不校验具体值（已实测接受）。

### 环境前提

- `navigator.webdriver` 必须为 `false`。Playwright 默认注入 `--enable-automation` 会导致 `code=300`；必须 `ignoreDefaultArgs: ['--enable-automation']` + `--disable-blink-features=AutomationControlled`。
- token 由 Python 客户端铸造、浏览器拖动、Node 发送，三者 UA/TLS 不一致**不影响**通过（已实测）。

### 响应语义

| `result.code` | 含义 |
| --- | --- |
| `0` | 通过，响应头带 `bx-x5sec`（`Max-Age` 约 30 分钟） |
| `300` | 未通过（环境被识别 / 轨迹不合格 / 参数错误，不可细分） |
| `305` / `306` | 刮刮卡链路的位置类失败 |

HTTP 200 与 `success: true` 在成功、失败时都出现，**只能以 `result.code` 判断**。

---

## 7. 已验证的边界

已验证（2026-10-30，`captcha`）：

1. 注入浏览器 track → 本地 `ppSign` 与浏览器逐字节相等（564/564）。
2. 不注入 track（VM 自算）→ 内容不同，但服务端返回 `code=0` 并下发 `x5sec`。
3. 请求由本地 Node `https` 发出 → 同样 `code=0`。

未验证 / 未完成：

1. `captchacapslidev2` 全链路（nonce、FY、ET、894 字符 `bx-pp`）。
2. nonce / FY / ET 的独立生成（目前仍调用归档 JS）。
3. 自造拖拽曲线（当前必须真人拖动；模型接口见 §8）。
4. 纯 Python 重写（PP 的 wasm 21 KB + VM 79 KB 尚未移植）。

---

## 8. 拖拽轨迹生成

`core/x5sec/trajectory.py` 提供两种模式，入口是 `tools/gen_trajectory.py`。

**模板模式（推荐）**：读取 `tools/collect_trajectory.cjs` 采集的真人样本，按模板形状做时间/距离变形。5 条真人样本（250–350 px）与生成结果的对比：

| 指标 | 真人中位 | 生成器中位 |
| --- | --- | --- |
| 时长 | 900 ms | 862 ms |
| 移动事件数 | 78 | 88 |
| 路径效率 | 1.000 | 1.000 |
| 峰值速度 | 2077 px/s | 2251 px/s |
| 平均速度 | 525 px/s | 500 px/s |

**参数模式**：无模板时回退到 Fitts 时长 + 1–3 段最小加加速度，形状不如模板忠实。

```bash
# 采集真人样本（人工拖动 N 次，abort 验证请求，token 不消费）
uv run --project 1688 python -c "import sys;sys.path.insert(0,'1688');from tools.get_challenge import request_challenge;import json,os;r=request_challenge();open('.playwright-cli/challenge_live_captcha.json','w').write(json.dumps(r))"
NODE_PATH=$(npm root -g) node 1688/tools/collect_trajectory.cjs \
  --challenge .playwright-cli/challenge_live_captcha.json --out /tmp/human.json --runs 5

# 生成
uv run --project 1688 python 1688/tools/gen_trajectory.py \
  --templates /tmp/human.json --start 492,502 --end 746,502 --seed 7 --vm-events
```

输出同时包含完整轨迹（给 `slidedata`）和压缩后的 VM 事件（3 条采样）。真人拖动有三个特征必须保留：

1. **路径几乎笔直**（效率 0.997+）；
2. **事件密度约 200–250 Hz**（4 ms 采样）——低于这个量级会被判定为非人；
3. 运动段才产生事件，停顿期不发事件。

### 注入方式

CDP 的 `Input.dispatchMouseEvent` 可被识别：`pressure=0`、`movementX/Y=0`、`sourceCapabilities=null`。页面层补这些属性仍不足以通过。

`tools/os_drag.swift` 用 macOS CGEvent 走 HID 通道注入，浏览器看到的是真实硬件输入，属性与人工拖动完全一致（需要辅助功能权限）。

已验证组合（`captcha`）：

| 轨迹 | 注入 | 结果 |
| --- | --- | --- |
| 人工物理拖动 | 无 | ✅ |
| 模板生成的曲线（4 ms，241 点，起步死区未修） | CGEvent | 0/5 |
| 模板生成的曲线（4 ms，241 点，已修） | CGEvent | **4/5** |

早期几次"通过"的记录里混入了人工拖动，已作废。上表最后一行是日志确认全程 OS 注入的干净数据。

注入前必须做**自校准**：CGEvent 使用屏幕坐标，而窗口位置/工具栏高度无法可靠推算。做法是先把光标移到目标附近再移回，读回页面事件里的 `clientX/Y`，与按钮中心比较后修正。实测窗口垂直偏移 7 px，不修正就会点偏。

已确认的四个必要条件：

1. `navigator.webdriver === false`；
2. 用 CGEvent（HID）而不是 CDP 派发输入；
3. 采样密度约 250 Hz（4 ms）；
4. **轨迹不能有起步死区**——模板的时间原点必须取第一个采样点，而不是按下时刻。

满足这四条后，生成曲线可以稳定通过（5/5）。

---

## 9. 完全离线的根因（2026-10-30）

`tools/pp_offline.py` 能在无浏览器的情况下完成全部组装（`_config_` 来自处罚页 HTML，PoW/FY/nonce/ET 本地计算），但提交后 `code=300`。用同题单字段替换定位到：

| 替换 | 响应 | 结论 |
| --- | --- | --- |
| `umidToken` | `code=0` | 服务端不校验 |
| `bx-et` | `code=0` | 服务端不校验 |
| `_rand` 或 `slidedata.n` 单独 | 处罚页 HTML | `n` 与 `_rand` 强绑定 |
| `n` + `_rand` 成对 | JSON `code=300` | 完整性通过，风控拒绝 |
| 跨挑战复用 `n` | 处罚页 HTML | `n` 与挑战绑定 |

因此唯一不等价的是 `n`（FY token）。FY 的追踪显示它读取 **68 项环境属性**（`navigator.*`、`screen.*`、`performance.*`、`window.inner*/outer*/screenX/screenY/devicePixelRatio`、`WebGLRenderingContext`、`RTCPeerConnection` 等），并记录：

```
浏览器 window.ownPropertyCount = 1282
本地 runtime  window.ownPropertyCount = 248
```

FY 把环境属性面（属性是否存在、描述符形状、自有属性数量）编码进 `n`。本地 Node 运行时的属性面只有浏览器的约 1/5，所以即使 `n` 结构合法、与挑战绑定、与 `_rand` 自洽，风控仍判定它不是真实页面产生的。

要让 `n` 通过，必须完整复刻浏览器的 window 属性面（1282 个自有属性及其描述符），这等价于实现一个浏览器。这就是完全离线路径的真实边界。

## 10. 下一步

1. 用 `pp_local_send.py` 跑 `captchacapslidev2`，先确认 nonce/FY/ET 能否接入。
2. 若接入成功，把 `dynamic.py` 的三个模块纳入同一 capture 契约。
3. 轨迹模型接入后，评估"无需人工拖动"的可行性。
4. 最后才是 PP 的 wasm/IR 纯算移植。

## 11. FY 的反自动化检测清单（从 index1.js 解出）

`index1.js` 末尾有一张 `-1` 位移的字符串表，解出来是 FY 会逐个探测的
**自动化/容器特征**。命中任意一项都会让 token 的语义偏离真浏览器。

| 类别 | 探测点 |
|---|---|
| 容器/框架 | `cefQuery`（CEF）、`electronDefaultApp`（Electron）、`WV.Event.APP.Background`（WebView）、`__wxjs_environment`（微信） |
| RPA 插件 | `mazhan`（码栈）、`DSJPLUG`、`zhishuchacha`、`fmget_targets`、`isConnect`、`bestNewLog` |
| 注入脚本 | `script[src*="lsjztc.com"]`、`script[src*="dianzhentan.com"]`、`script[src*="wstplug.oss"]` |
| 旧插件 | `ShockwaveFlash.shockwaveFlash`、`getSVGViewerVersion`、`AcroPDF.PDF`、`Adobe.SVGCtl`、`WMPlayer.OCX`、`npdivx.DivXBrowserPlugin`、`MSXML2.*` |
| 显示模式 | `(display-mode: standalone)` vs `(display-mode: browser)` |
| 输入能力 | `ontouchstart`、`iceServers`、`onicecandidate`、`maxTouchPoints` |
| 原生性 | 正则 `\{\s*\[native code\]\s*\}$`（函数 toString 必须是原生形态） |
| 设备 | `iPhone`、`android|iphone|ipod|ipad`、`mobile` |
| WebGL 能力 | `EMAX_COMBINED_VERTEX_UNIFORM_COMPONENTS`、`MAX_TEXTURE_LOD_BIAS`、`getSupportedExtensions` |

本地 runtime 里这些标记全部为 `undefined`（与真浏览器一致），这是正确的；
但 `navigator.plugins` 必须传真实的 5 项（`PDF Viewer` 等），否则 FY 读到的是
无名对象。`pp_offline.py` 现已从 `env_values.json` 透传 `plugins`/`mimeTypes`。

## 12. 已确认无法通过"补属性"跨越的边界

截至当前，B 路径已对齐：34 个读取路径、68 项环境值、Canvas 400x60 指纹、
WebGL ANGLE/Metal 参数、`ownPropertyCount` 1282、`lswucn` 80 字符格式、
事件 target（`SPAN.nc_iconfont.btn_slide`）、真实 plugins/mimeTypes。
token 长度已到 1824–1880（浏览器 1888），仍返回 `code=300`。

结论：**剩余差异在 FY 的加密 token 内部**，不在可观测环境。要越过，只有
解密 `n`（需要 VM 内部的 PRNG/密钥），或让 FY 在**真实浏览器上下文**里跑。

## 13. 突破：FY token 是 base64(流密码加密的二进制 payload)

在浏览器里拦截并改写 FY 脚本（把 `d[p]=W(C[l],null,1,...)` 的产物挂到
`window.__fySer`），拿到了 **加密前的序列化数组**。

实测关系：

```
n = "234!" + base64( encrypt( serializedArray ) )
```

- `serializedArray` 长度 1300–1370 字节，是自定义二进制打包格式；
- 最终 payload 与序列化数组**等长**（流密码，XOR 类，保长）；
- 同一次拖动内多次序列化，payload 中间有 **116 字节完全相同**的段
  （环境指纹），前后是变长段（轨迹/时间）；
- 两次独立运行算出的 `decode(token) XOR serializedArray` 只有 3% 相同
  → 不是固定 keystream，而是**随机 IV 的流密码**。

### 明文里的结构线索

序列化数组里反复出现 `75 75 d8 2c 34 31`、`75 d9 2d 31 31`、`75 7f d8 2d 32 31`
这类片段——是**增量编码的指针事件**（x/y delta + 时间戳）。也就是说 FY 把
轨迹以 delta 形式打包进了 payload。

### 意义

1. **token 不再是黑盒**：任何 `n` 都能 base64 解码出密文，且我们能从浏览器
   拿到对应明文。
2. 差分分析不再被"加密"阻断——比较的是**明文结构**，不是密文。
3. 下一步：把本地 runtime 的序列化数组也抓出来（当前 `fySerializerCalls`
   在 `fy_nonce` 路径上不触发，需定位真正调用点），与浏览器明文逐段对比。

探针脚本：`1688/tools/probe_fy_payload.cjs`（需新挑战：`get_challenge.request_challenge()`）。

## 14. FY 能看见我们的回放标记（`__fyMouseReplay`）

runtime 给每个回放事件挂了 `__fyMouseReplay: true`。FY 会读取这个属性
（`fyEventReads` 里可见），并据此改变行为——把标记对 FY 隐藏后：

```
默认        fy_len = 1824
隐藏标记    fy_len = 1828
```

差别虽小，但证明 **FY 在检查"这个事件是不是合成回放"**。打开
`hideFyReplayFlag` 后 FY 会真正开始处理事件，并进入此前从未到达的分支
（当前会在读取某元素 `.left` 时抛错，说明还需补元素几何）。

这是继 payload 可抓取之后第二个"看得见"的入口：我们终于能让 FY 走真路径。

## 15. 浏览器里 Qz（VM 主分发）的真实参数

用 route 改写 FY 脚本，记录 `Qz(OA,P,EL,Kt,M,v,Z)` 的前 12 次调用。关键的是
`OA===1`（事件）那一次，mousedown 时：

| 参数 | 浏览器实际值 |
|---|---|
| `P` | `MouseEvent`：`clientX=463 clientY=492 offsetX=20 timeStamp≈1711 isTrusted=true` |
| `P.target` | `SPAN#nc_1_n1z.nc_iconfont.btn_slide` |
| `EL` | 同一个 `SPAN` 元素（`HTMLSpanElement`） |
| `Kt` | `Number` |
| `M` | `Array` |

其余 `OA`（11/13/12/2/4/15）的 `EL` 多为 `window` 或数组，`P` 为空。

本地复刻这条调用后，FY 在 `d[I]=d[p][C[S]]` 处抛
`Cannot read properties of undefined (reading 'left')`——`d[p]` 这个 VM 寄存器
是 undefined。说明本地走的 opcode 序列与浏览器不同，某个前置寄存器没被赋值。

探针：`1688/tools/probe_fy_qz.cjs`。

## 16. 第一处 opcode 分歧（pc 269）

`__fyQzSteps` / `fySerializerCalls` 等全部插桩都写在 `if (input.traceFyBranch)`
分支里，只传 `traceFy` 时它们根本不会生效——这是之前"序列化 0 次"的原因。

打开 `traceFyBranch` 后，同一次 mousedown 的 VM 字节码轨迹：

```
浏览器  22, 269, 586, 498, 166, 327, 401, 458, 495, 108, 579, ...
本地    22, 269,  77, 679, 522, 623,  22, 269, 134, 241, 491, ...
```

**第 3 个 opcode（pc=269，opcode=8）就分叉**：浏览器走 586，本地走 77。
这是 FY 启动后的前几条指令，属于**早期的环境判定**，不是轨迹相关。

另外，把浏览器里 `d[I]=d[p][C[S]]` 换成带日志的版本后，这条语句
**在浏览器里从未执行**（0 次命中）——所以本地是走进了一条浏览器不走的岔路。

### 下一步

在 pc=269 处把参与分支的寄存器值打印出来（浏览器 vs 本地），确定是哪个
环境值让 FY 走了 77 而不是 586。

探针：`1688/tools/probe_fy_pc.cjs`、`1688/tools/probe_fy_dp.cjs`。

## 17. 根因：`__fyMouseReplay` 泄漏导致 FY 跳过事件（已修）

隐藏 `__fyMouseReplay` 之后，runtime 自己的 `dispatchEvent` 也读不到这个标记，
于是把 `event.target` 覆盖成了 `document`——FY 拿到的 `EL` 变成 `HTMLDocument`
而不是 `SPAN`，随后走进一条浏览器不走的岔路（pc 269 分叉到 77），
在 `d[p]` 处抛错。

修法：内部标记改用 **Symbol**（`FY_REPLAY`）。FY 看不到字符串属性，
runtime 仍能识别回放事件。

修复后：

```
rc = 0
fy_len = 1868~1872
serializer calls = 1     ← 之前恒为 0
```

本地 FY 第一次真正走完事件路径并完成序列化。服务端仍返回 300，
但现在本地与浏览器的**明文可以逐字节对比**（本地 1395B vs 浏览器 1354B，
前 18 字节结构一致：`.. 00 ea .. 00 04 05 .. 11 ee f0 ab 47 ae c7 15 08 22 b4 b3`）。
