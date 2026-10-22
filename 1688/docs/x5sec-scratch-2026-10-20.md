# `captchacapslidev2` 滑动验证：Playwright 实测链路

本文按时间保留调查过程，正文中早期“不一致”结论是当时状态。当前逐字节复验结果和新版本排查步骤见[动态参数复验手册](x5sec-reverse-playbook.md)。

2026-10-20 使用项目中的企业搜索请求触发挑战，并且仅用 Playwright 打开和操作挑战页。本记录中的动态值已省略。它记录的是当前实际出现的 `scratch-captcha/0.0.59` 分支；[此前的 `/slide` 样本](x5sec-challenge.md)使用 `nc.js` 和 `slidedata`，不能直接套用到这条分支。

## 触发与页面

使用 SDK 的令牌引导及签名逻辑发送 `getCompanyList` 请求，在 Python 3.12.10 / OpenSSL 3.0.16 且 `User-Agent: python` 的运行环境中观察到 `FAIL_SYS_USER_VALIDATE` 和挑战 URL。相同请求在项目虚拟环境的 OpenSSL 3.6.2 下直接返回 `SUCCESS`。这是两次环境观察，不能单独证明风控只取决于 OpenSSL，也不是稳定触发挑战的保证。

后来对同一企业搜索请求做并发复测：项目虚拟环境的 8、20、40 次并发均为 `SUCCESS`；Python 3.12.10 环境的首批 10 次也全为 `SUCCESS`，下一批 30 次中 1 次返回挑战 URL、29 次返回 `SUCCESS`。因此并发能够再次取得新挑战，但每次请求不保证触发。

挑战 URL 带 `x5secdata`、`x5step=2`、`action=captchacapslidev2`。Playwright 打开后，页面加载 `https://g.alicdn.com/bsop-static/scratch-captcha/0.0.59/index.js`、FY、ET、nonce 和 `program.wasm`。页面的 `_config_` 提供 `NCTOKENSTR`、`NCAPPKEY`、`SECDATA`、`pp`、`ppSign`、`ppt` 等值；初始化后的 `window.FYModule` 暴露 `getFYToken()`、`getUidToken()` 和 `fyObj.startRecord()`。

## 当前分支的请求链

1. 页面向 `/_____tmd_____/newslidecaptcha` 请求题目，查询字段包括 `token`、`appKey`、`ua`、`x5secdata`、`language`、`pageVersion`、`_rand`、`v`。
2. 成功的题目响应含 `imageData`、`ques`、`encryptToken`。`imageData` 是图片，`ques` 是提示图片；`encryptToken` 必须随本题的验证请求传回。
3. 拖动开始时，组件调用 `window.FYModule.fyObj.startRecord()`。松开时，它向 `/_____tmd_____/newslidevalidate` 发送 GET。实测字段顺序为 `token`、`appKey`、`ua`、`umidToken`、`encryptToken`、`x5secdata`、`time`、`pageVersion`、`fireyeVersion`、`width`、`per`、`ppt`、`_rand`、`v`；请求头还包含 `bx-et`、`bx-pp`。
4. `ua` 与 `umidToken` 来自 FY；`encryptToken` 来自同一题目响应；`time` 是拖动耗时。组件把最大可拖动宽度写入 `width`，本次为 `272`；将 `(拖动距离 + 24) / 组件宽度` 四舍五入到三位小数写入 `per`，本次组件宽度为 `320`。`_rand` 由 nonce 模块针对 FY 输出和验证阶段生成；`ppt` 与 `bx-pp` 分别是 PoW 耗时和签名，不能互换。

前几次 Playwright 滑动的验证响应是 HTTP 200，正文 `code` 分别出现 `306`、`300`，均未返回 `bx-x5sec`。随后在 detail.1688.com 的同类题目上有一次浏览器验证返回 `code=0`，设置了长度为 220 的 `x5sec` Cookie 并跳转到 1688 首页；当时只记录了响应和 Cookie，没有保存该次完整验证请求。其他失败样本不能区分图像答案、拖动轨迹、浏览器环境、挑战与 Cookie 上下文不一致等原因。

2026-10-21 对 `captchacapslidev2` 重新抓包：同一题第一次验证返回 `code=300`，第二次返回 `code=0`，响应带 `bx-x5sec`（341 字符）。这次保存了成功的完整 `/newslidevalidate` 请求、响应和 FY、nonce、ET 函数调用的显式入参。用 [`compare_scratch_x5sec.py`](../tools/compare_scratch_x5sec.py) 对照，Python 重建的查询串与成功请求逐字节一致，PoW 主体也是请求头 `bx-pp` 的精确前缀。成功请求的 `bx-pp` 共 894 个十六进制字符，前 426 个字符由 Python PoW 对齐，余下 468 个字符仍缺少独立生成方法。查询串对齐时使用了浏览器调用输出的 FY、nonce 和本题 `encryptToken`，不能视为这些动态模块已经还原。

对六次 `/slide` 与 `captchacapslidev2` 抓包解码 `bx-pp` 后，末段均为 `耗时|变化的 Base64 文本|固定的 24 字符文本`。固定文本在六次抓包完全相同；变化文本在同一页面连续拖动后增长，因此它至少依赖页面累计状态，不能作为固定 PoW 尾缀。成功的第二种挑战中该文本长 208 字符，之前失败提交长 124 字符。Playwright 对 `_config_.ppSign` 的 setter 记录显示，426 字符的 PoW 主体由公开 `punishpage.min.js` 写入，而 894 字符的值由处罚页内联的 VM 脚本写入。后续要在这个 writer 处断点还原附加段的构造。

在相同显式函数入参和调用内 `Math.random`、`Date.now` 记录下，本地归档 JS 运行时的 FY 输出为 1800 字符，浏览器成功值为 2852 字符；nonce 均为 160 字符但内容不同；ET 分别为 469 和 485 字符。成功拖动的事件采集达到当时设置的 1000 条上限，所以该次 FY 对照还缺少完整事件；另一次事件完整的失败请求，浏览器 FY 为 2772 字符，本地为 1976 字符，同样未对齐。这些差异表明当前本地运行环境和内部状态快照不完整。页面上连续两次以相同显式参数调用 nonce 函数也会得到不同输出，因此单独复用函数入参不能证明内部状态一致。

后续用 Playwright 核对当前 `index1.js` 与归档 FY 脚本，内容相同，归档文件只多了末尾换行。进一步在页面加载开始时记录随机数，发现 FY 和 ET 在验证函数被调用之前就已消耗随机数；本地仅重放函数调用内的随机数，无法使两边的内部状态一致。页面加载时还会读取 Canvas 和 WebGL 结果；本地指纹模拟尚未覆盖完整的调用顺序和数据。因此当前失败的逐字节比较是明确的未通过结果，不是脚本版本不一致造成的已知假象。

新挑战打开前已将源请求的三个 Cookie 注入 Playwright 会话。两次验证分别为 `code=306`（页面提示滑动位置不对）和 `code=300`（页面提示验证不通过）；第三次通过 Playwright 截取了同题原始图片，并单向拖动到目标图案右边缘附近，仍返回 `code=300`。随后源请求的 User-Agent 和 Cookie 发生变化；按新值重新建立 Playwright 上下文后，验证仍返回 `code=300`。在一题“一个车”中，拖动时截图确认车辆刚好完整露出，提交返回 `code=305`，随后处罚页跳至错误页。上述结果仍不能把图像答案、FY 轨迹、过期题目和浏览器与 Python 的网络上下文区别开。

[`scratch_params.py`](../core/x5sec/scratch_params.py) 已用纯 Python 构造本分支的题目与验证查询串，包括字段顺序、URL 编码和 `per` 的三位小数计算。它要求调用方提供 FY 的 `ua`、`umidToken`，nonce 的 `_rand`，以及同题的 `encryptToken`。

[`pow.py`](../core/x5sec/pow.py) 已用纯 Python 复现 PoW 主体：生成 16 字母随机串，对 `l|i|q|t|f|k|1|1||随机串|计数` 求 MD5，按 `q` 首字符重复 `l` 次检查摘要从 `i` 起的字符，最后将 `xb:...` 文本转成十六进制。这里两个相邻竖线表示本次初始挑战的第三个标记为空；失败后重算时可为 `1`。当前页面 `l=0` 的固定随机串样本与 WASM 输出逐字节一致；调用同一 WASM 时临时传入 `l=2`，Python 找到相同的第 760 次尝试和相同摘要。耗时字段随运行环境变化；`ppt` 应使用 Python 求解时的实际耗时。另一条 `/slide` 分支的成功请求还带有未定位的 `bx-pp` 附加段，不能据此认定所有 `bx-pp` 已完全还原。

在同一 Playwright 页面中，对相同输入连续调用两次 `crypto.genRandomValues("abc", 1)` 得到了不同的 160 字符结果。这说明 nonce 计算至少含随调用变化的状态或随机性，不能把某次抓包值当作固定映射表。

进一步用 Playwright 的 CDP Debugger 在归档 nonce 脚本的 `Bt` 内层函数入口（脚本偏移 31283）设置断点，而不只是在公开函数外围记录参数。两次调用的显式参数、临时栈指针和对象表长度相同，但断点前的 16 MiB 线性内存有 148 个字节不同。仅恢复这块内存后输出仍不同；同时把模块导入的 `Date.now` 和 `Math.random` 固定，并在第二次调用前恢复内存，两次调用的前 80 个解码字节及后续大部分字节相同，只在字节 80 至 83 不同。将两次调用放在同一个循环调用点后，120 个解码字节全部相同。这证明 nonce 在完整状态、时间、随机输入和调用路径一致时可以确定性重放；字节 80 至 83 与不同调用点相关，具体取值来源还需继续定位。先前“同显式参数输出不同”不能推论独立生成的 nonce 一定无法通过校验。

继续取 24 次 nonce 并按 URL-safe Base64 解码，结果均为 120 字节；第 9 字节均为 `0`，其他位置没有发现固定字节。即使临时固定页面的 `Math.random`、`Date.now` 和 `crypto.getRandomValues`，连续两次仍不同，说明还存在未定位的状态或时间源。对同一测试 URL 连续调用两次 `etSign` 也得到不同的 481 字符值。因此目前无法把 nonce 或 ET 简化成标准随机字节或单一 URL 哈希。

另一次新题由用户一次拖动通过：`newslidevalidate` 返回 HTTP 200、`result.code=0`，并签发 `bx-x5sec`。完整抓包包含 182 条事件以及 `record`、`uid`、FY、nonce、ET 的调用；本地逐字节重建查询串与 PoW 主体成功，FY、nonce、ET 的同显式入参重放仍未对齐。成功请求中的 ET 调用入参是 `//h5api.m.1688.com:443/...`，而请求 URL 是 `https://h5api.m.1688.com/...`。一次只替换 `_rand` 的实验误把完整请求 URL 传给 `etSign`，服务端返回 HTML 而非验证 JSON，使页面停在等待状态。恢复原请求处理并打开新题后，页面正常且用户通过；这次实验无法判断本地 nonce 本身是否被服务端接受。

对另一次拖动设置 Playwright CDP 函数调用断点后，处罚页内联 VM 在写入 `_config_.ppSign` 时的局部变量 `Q` 与实际请求头 `bx-pp` 的 1230 个十六进制字符完全相同。对两道不同的 `captchacapslidev2` 题和一道 `captcha` 题提取该内联脚本，三份均为 79063 字符且 SHA-256 相同。这允许把同一份脚本作为 Python 调用 JS 的回退实现基础；但还需补齐它依赖的页面状态，不能仅凭脚本相同认定参数已还原。

本地 JS 运行时在固定 UMID 和页面配置下重复生成 5 次 `_rand`，得到 5 个不同的 160 字符值；URL-safe Base64 解码均为 120 字节，第 9 字节均为 `0`，与上述 Playwright 样本的长度和固定字节一致。这是结构对齐，尚非服务端验证通过。

单独测试 `newslidecaptcha` 时，传入 `ua=defaultFY`、`_rand=no_nonce` 仍得到 `code=0` 的题目响应。这只能证明题目接口没有在该次请求上拒绝这两个回退值；尚未证明 `newslidevalidate` 会接受它们。

进一步定位到 FY 初始化实际可以在本地 JS 运行时完成：只要提供 `Document`、`Navigator`、`Performance`、Canvas/WebGL 和事件接口，归档的 `index1.js` 会生成 `234!` 开头的动态 `ua`。ET 脚本能在同一类精简环境下输出签名；nonce 的二进制脚本需按加载器逻辑在首个零字节拆分，再把剩余字节作为 `__DAT__` 替换内容执行，本地可得到 160 字符 `_rand`。这些 VM 模块尚未移植为纯 Python，故 [`dynamic.py`](../core/x5sec/dynamic.py) 由 Python 调用本地 [`js_runtime.cjs`](../core/x5sec/runtime/js_runtime.cjs)，外层参数组装和 PoW 仍为纯 Python。

`umidToken` 来自 `https://ynuf.aliapp.org/w/wu.json` 的 `__fycb(...)` 值。Python 请求该端点取得 68 字符令牌，URL-safe Base64 解码后为 50 字节。Playwright 页面的 `localStorage.lswucn` 保存了 `令牌@@秒级时间戳`，FY 的 `getUidToken()` 返回其中的令牌。本地运行时先写入同结构的值，再生成 FY 参数；生成后检查内部 UMID 与请求令牌一致。`prepare_question_request` 用本地 FY 与 nonce 模块生成 `ua`、`_rand`，实测请求 `newslidecaptcha` 返回 `code=0`，含 `encryptToken`、`imageData`、`ques`。`prepare_verify_request` 可生成查询字段、`bx-et` 和 `bx-pp`，但尚未得到服务端成功响应，不能视为 x5sec 已还原完成。

## 接下来的验证边界

- 把 FY 的事件目标、坐标和完整事件序列，以及 nonce/ET 的初始化状态纳入本地重放。在同一挑战、同一调用点和完整输入状态相同时，逐字节比较浏览器与本地的 FY、nonce、ET 输出。拖动到错误位置仍可触发这项算法对照。
- `bx-pp` 的 VM 附加段已有同入参逐字节对照，见下文。SDK 的验证请求函数尚未接入这段 VM 重放；它目前仍只写 PoW 主体。
- 算法逐字节对齐后，再单独验证图像答案、轨迹和服务端 `result.code=0`、`bx-x5sec` 签发。这是后续端到端验证，不作为当前算法还原的判断标准。

## 2026-10-21：`ppSign` VM 同入参复验

在全新 `captchacapslidev2` 挑战上，用 Playwright 故意拖错位置；在处罚页 VM 的编码函数入口（PC 4117）记录本次轨迹字符串，同时记录页面配置、初始化命令、六个拖动命令及其事件对象。由 Python 调用归档 VM 和 `punish/0.0.4` WASM，在相同输入下重放。浏览器与本地的 `ppSign` 均为 724 字符，逐字节相等。另一次独立挑战也由 [`capture_pp_vm.py`](../tools/capture_pp_vm.py) 完整采集并复验，结果仍为 724/724 字符相等；第三道挑战还确认实际发出的验证请求头 `bx-pp` 与本地 724 字符值完全相等。前三个 WASM 字符串入参在第一道题的断点对照中也逐项相等。

本地 VM 最初在编码时得到空串，原因是缺少浏览器的 `btoa`；补齐后六个拖动命令的 VM 执行步数与浏览器一致。轨迹串包含页面计时和随机值，因此逐字节比较时在编码入口固定为浏览器记录的同一输入。省略这个输入时，本地 VM 可以自行生成同格式 `ppSign`，但其动态轨迹与浏览器当次值不同，不能据此宣称独立运行仍会逐字节相等。工具和使用方法见 [`tools/README.md`](../tools/README.md)。FY、nonce、ET 的本地输出仍未完成同输入对齐，整个验证请求算法尚不能称为全部还原。

## 2026-10-21：ET 初始化状态对照

新建的 [`capture_dynamic.py`](../tools/capture_dynamic.py) 在同一道错误滑动题上采集 FY、nonce、ET 的真实调用和请求头，并把函数入参及调用内随机数交给本地脚本重放。ET 函数返回值与实际 `bx-et` 请求头相等，因此这次比较直接覆盖了请求使用的值。

Playwright 函数断点确认 ET 签名经归档脚本的 `M(14)` 路径生成。补齐 `Screen`、`MouseEvent`、`Navigator`、`TouchEvent` 的原型属性后，环境检测 `M(23)` 的 1400 步路径及返回数值能与浏览器对齐。继续跟踪初始化路径发现，Node 22 的内置 `navigator` 是无 setter 的属性，直接赋值未生效；归档脚本还读取 `window.origin`、`window.top`、PointerEvent、Canvas/WebGL 构造器和 `AWSCInner.register`。ET 初始化读取的 Cookie 长 366 字符，而页面完成加载时 Cookie 长 678 字符；本地必须保存两个阶段的 Cookie，不能只复用最终快照。

在最近的一道同题对照中，浏览器签名调用点的 `String.prototype.charAt.value` 为 `1`，本地初始化后为 `0`；把调用点状态作为相同输入重放，可将 VM 首次路径分歧从第 6050 步推迟到约第 8490 步。用浏览器初始化时刻重放 `new Date()` 后，168 项指纹仍有 10 项不同。在该题中，ET 浏览器输出 477 字符、本地输出仍不相等；另一道题的编码前字节数组分别为 179 和 176 字节，首次字节差异在索引 6。FY 与 nonce 也仍未逐字节一致。这些差异说明当前 `sign_et`、`make_fy_nonce` 仍是可运行的本地生成器，不能作为算法已还原的证明。

## 2026-10-21：ET 目标调用的剩余差异

新的 Playwright 采集把 ET 初始化与目标验证调用的 VM 轨迹分开保存，并记录目标调用内六次无参 `new Date()` 的真实毫秒值。将浏览器调用时 168 项指纹中的 8 项、事件对象、`CryptoKey` 和计时样本临时注入本地运行时后，同一题的浏览器与本地 VM 执行位置 11,784 步完全相等，编码前 169 字节载荷也完全相等。ET 都是 465 字符，但第 402 至 406 位仍不相等；去掉首字符后按 URL-safe Base64 解码，差异仅在连续 4 个字节。该注入只用于定位差异，尚不能证明本地可独立生成相同 ET。

目前仍需追查 ET 这 4 个字节的来源，并让本地环境自行生成调用时指纹和计时状态。FY 长度与内容、nonce 内容仍不一致。`ppSign` VM 已在相同输入下逐字节对齐，但尚未接入 SDK 验证请求。上述工作完成后才可称为验证参数算法对齐；纯 Python 移植与真实滑块答案是独立的后续工作。

## 2026-10-21：ET 对齐与 nonce 自动补环境

后续在三道全新挑战上，用 `--startup-trace --trace-et-pc` 捕获同一调用点的完整输入，浏览器和本地的 `bx-et` 均为 465 字符，逐字节相等；编码前 169 字节也一致。旧段落中的 ET 4 字节差异是此前的中间状态。这个结论限定在完整状态回放的同输入验证，不等于 SDK 已能独立取得全部状态。

nonce 侧的 `diff_nonce_trace.py` 现在能自动回放浏览器快照中的确定性环境值，并比较 VM 调用编号、函数注册调用点、Worker 回调、图片加载、Canvas 像素摘要和输出。最近一道挑战中，自动回放补上 9 个属性，把环境值差异从 41 项降为 32 项；剩余 32 项中 31 项涉及对象或函数行为。双方 25 次 VM 调用编号顺序一致，但函数注册分别为 86 与 81 项。双方都对 4,194,304 字节的 Canvas 像素做 SHA-256，输入哈希仍不同，nonce 四个阶段的输出均未逐字节相等。自动补环境只覆盖可序列化的确定性值；Canvas 绘制、Worker、RTC 事件和 DOM 行为仍需独立实现或同题回放。FY 也尚未对齐。

## 2026-10-21：nonce 同输入逐字节对齐

继续手动补齐浏览器环境后，在两道新 `captchacapslidev2` 挑战上，Playwright 采集的最终滑动阶段 nonce 与本地归档 VM 输出均为 160 字符，逐字节相等。清理临时定位插桩后的新题由 `capture_dynamic.py --startup-trace --trace-nonce-gt` 直接报告 `nonce.equal=true`。这项验证复用同一道题的 FY 入参、随机数、时间、鼠标事件、Worker 消息和页面状态；错误滑动位置不影响对照。

关键环境差异是 `Document.prototype.hasFocus` 的接收者检查、阶段变化的 `window` 属性、Worker 消息到达边界、`requestAnimationFrame` 回调时间，以及鼠标事件的 `screenX/screenY`。其中浏览器无接收者调用 `hasFocus` 会抛出 `Illegal invocation`，本地原先返回 `true`，使 Promise 后续回调漏执行。浏览器鼠标事件的屏幕坐标也并非直接等于客户区坐标。Canvas 绘制的像素摘要输入、SVG 内容及环境属性存在检查点对照。

这个结论是**同输入重放的 nonce 算法对齐**，不是独立求解全部动态状态。当前工具仍用归档 JS VM 执行 nonce，并从 Playwright 快照重放 Worker、页面与计时状态；FY 的独立对齐及无快照场景尚未由本次结果证明。上文记录的 nonce 不一致是修复前的中间状态。

FY 新增 [`diff_fy_trace.py`](../tools/diff_fy_trace.py) 定向差异工具。工具在同一道题中记录 FY 初始化、题目请求前的两次调用、拖动前探针和拖动后的真实调用，最后用浏览器的 52 条左右鼠标事件重放，不依赖滑动位置正确。新题确认当前浏览器脚本与归档 `fy-index1.js` 相同；重放浏览器配置、随机数、Canvas 数据、WebGL 常量与参数、前置 FY/UID 调用、脚本加载时 Cookie 和 `currentScript` 后，FY 初始化和目标调用阶段的 Canvas/WebGL 记录均已对齐，两个采样环境快照也无差异。浏览器初始化仍比本地多一次位于脚本列 `10976` 的 `Math.random()` 调用；定向探针显示浏览器初始化走到 `opcode=11, pc=356`，本地首次走到该位置时是另一条 VM 路径。拖动后的 FY 长度和内容仍不相等，因此 FY 算法尚未完成同输入对齐；下一步应沿该 VM 分支继续定位未采样的内部状态。

## 2026-10-22：FY 同输入逐字节对齐

继续补齐浏览器事件对象、DOM 原型、`document.body.scrollTop/scrollLeft`、字体宽度、事件日期读数与调用栈来源后，FY 拖动前基线及拖动后的完整字符串均与浏览器相等。两道全新挑战复验通过；重放的错误拖动含 52 条事件，双方完整 FY 的首次差异为空。轨迹仍由 Playwright 错误拖动采集，后续可以在 `events` 输入边界接入自行生成的轨迹。日期和栈帧在浏览器读取点采集并作为环境输入重放；这不是脱离采样的独立纯 Python 生成器。复现命令、关键检查点与版本更新顺序见[动态参数复验手册](x5sec-reverse-playbook.md)。
