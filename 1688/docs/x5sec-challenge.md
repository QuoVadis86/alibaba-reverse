# 1688 滑块校验接口

以下是 2026-10-20 捕获的一次成功滑动请求及一次失败响应。动态值已省略；参数来源依据同次加载的 [JS 样本](reference/README.md) 标注。

## 请求

方法为 GET，地址为：

```text
https://h5api.m.1688.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/_____tmd_____/slide
```

成功请求的查询参数如下：

| 参数 | 本次观察 |
| --- | --- |
| `slidedata` | JSON 字符串，具体字段见下表 |
| `x5secdata` | 当前滑块挑战值 |
| `ppt` | 本次成功请求为 `2` |
| `_rand` | nonce 模块生成的动态值 |
| `landscape` | 本次为 `1` |
| `ts` | 提交时的毫秒时间戳 |
| `fireyeVersion` | 本次为 `1.234.37` |
| `pageVersion` | 本次为 `0.1.129` |
| `v` | 请求附带的随机值 |

`slidedata` 解析后的顶层字段为 `a`、`t`、`n`、`p`、`scene`、`asyn`、`lang`、`v`。本次 `scene=register`、`asyn=0`、`lang=cn`、`v=1`；`n` 是长度为 1976 的不透明字符串。`p` 本身也是 JSON 字符串，解析后包含 `ncbtn`、`umidToken`、`ncSessionID`、`et`。成功请求还带有 `bx-et` 和 `bx-pp` 请求头。

## 参数来源与生成

表中“已复现”指字段的组装规则已写入 [`slide_params.py`](../core/x5sec/slide_params.py)；需要运行时模块提供的值仍需从实际页面取得。对应源码可在 [reference](reference/README.md) 中按版本查阅。

FY 输出 `n` 与 `umidToken` 的调用链和 Python 移植边界另见 [FY 模块分析](fy-module-analysis.md)。

| 字段 | 来源与生成规则 | 状态 |
| --- | --- | --- |
| `slidedata` | `punishpage` 将 `nc.js` 返回的 `t.data` 用 `JSON.stringify` 包装。对象字段按 `a,t,n,p,scene,asyn,lang,v` 顺序生成。 | 组装已复现 |
| `slidedata.a` | 页面 `_config_.NCAPPKEY` 传给滑块组件的 `appkey`。 | 已复现，值来自挑战页 |
| `slidedata.t` | 页面 `_config_.NCTOKENSTR` 传给组件的 `token`。 | 已复现，值来自挑战页 |
| `slidedata.n` | `nc.js` 调用 `__fy.getFYToken(__fy_options)`；拖动开始时调用 `fyObj.startRecord()`。本次是 1976 字符的动态值。 | FY 内部生成，尚未还原 |
| `slidedata.p` | `nc.js` 将 `trans` 对象序列化为 JSON 字符串，再放进外层 JSON。 | 组装已复现 |
| `p.ncbtn` | 拖动开始时取滑块按钮的 `getBoundingClientRect()`，按 `x\|y\|width\|height\|top\|bottom\|left\|right` 拼接。本次为 `452\|771.5\|42\|30\|771.5\|801.5\|452\|494`。 | 已复现，值来自 DOM |
| `p.umidToken` | `nc.js` 调用 `__fy.getUidToken()`。 | FY 内部生成，尚未还原 |
| `p.ncSessionID` | 轨道元素的 `offsetWidth + 'a' + offsetHeight + 'a' + 绝对 left + 'a' + 绝对 top` 当作 11 进制整数，再转小写 16 进制。绝对位置沿 `offsetParent` 链累加。本次为 `5e701eb82993`。 | 已复现，值来自 DOM |
| `p.et` | `nc.js` 根据 `sgnReady` 写入字符串 `"1"` 或 `"0"`。 | 已复现，状态来自组件 |
| `slidedata.scene` | `punishpage` 按终端模式选择 `register` 或 `register_h5`；本次为 `register`。 | 已复现 |
| `slidedata.asyn`、`lang`、`v` | `nc.js` 写 `asyn:0`、页面语言及 JS 版本号；本次为 `0`、`cn`、`1`。 | 已复现 |
| `x5secdata` | 页面 `_config_.SECDATA`，与挑战地址携带的 `x5secdata` 一致。 | 已复现，值来自挑战页 |
| `ppt` | 页面 `powFun` 调用 `program.wasm` 的 `_pp`，将计算开始到结束的 `Date.now()` 差值向下取整；本次为 `2` 毫秒。 | Python PoW 已实现，耗时随运行变化 |
| `_rand` | `punishpage` 调用 `window.crypto.genRandomValues(slidedata.n)`；方法由页面 nonce 脚本提供。异常或未加载时另有 `run_error`、`not_loaded` 等回退值。 | 生成逻辑尚未还原 |
| `landscape` | 页面判断横屏时写 `1`，竖屏时不发送；本次为 `1`。 | 已复现 |
| `ts` | 提交回调里用 `(new Date).valueOf()` 取毫秒时间戳。 | 已复现 |
| `fireyeVersion`、`pageVersion` | 请求工具在 `/_____tmd_____/slide` 请求上追加常量 `1.234.37`、`0.1.129`。 | 已复现 |
| `v` | 请求工具执行 `('v=' + Math.random()).replace('.', '')`。查询参数的值保留前导 `0`。 | 形式已复现，随机值不可预测 |
| `bx-et` 请求头 | 请求工具对完整 GET URL 调用 `window.etSign(url)`。 | ET 签名尚未还原 |
| `bx-pp` 请求头 | `powFun` 产生的 `_config_.ppSign`，随请求发送。 | Python 已对齐 PoW 主体；本次成功请求还有 140 个十六进制字符的附加段，来源待确认 |

请求地址的 `HOST`、`PATH` 也来自挑战页 `_config_`，`punishpage` 在其后添加 `/_____tmd_____/slide`。当前样本走普通查询参数路径；源码还包含将参数编码进路径的另一分支，该分支未出现在本次成功请求中。

Python 可直接构造已确认的 JSON 和查询参数，调用方须提供挑战页配置、实际 DOM 几何值及 FY/nonce 的动态值：

```python
from core.x5sec.slide_params import (
    ButtonRect,
    SlideRequestInput,
    TrackGeometry,
    build_slide_request,
)

request = build_slide_request(
    SlideRequestInput(
        appkey=page_config["NCAPPKEY"],
        token=page_config["NCTOKENSTR"],
        secdata=page_config["SECDATA"],
        fy_token=fy_token,
        umid_token=umid_token,
        rand_value=nonce_value,
        button=ButtonRect(**button_rect),
        track=TrackGeometry(**track_geometry),
        et_ready=et_ready,
        ppt_ms=ppt_ms,
        landscape=is_landscape,
    )
)
query_string = request.to_query_string()
```

`fy_token`、`umid_token`、`nonce_value` 和 `bx-et` 仍需独立生成；`bx-pp` 的 PoW 主体可由页面 `pp` 对象经 [Python PoW](../core/x5sec/pow.py) 计算。`ppt_ms` 是计算耗时，不等于 `bx-pp`。Python 默认生成当前 `ts` 和符合查询格式的随机 `v`；需要与某一次浏览器请求逐字节比对时，可显式传入 `timestamp_ms` 和 `request_v`。

同一条成功请求的 Playwright 网络记录可用 [`compare_x5sec.py`](../tools/compare_x5sec.py) 检查。把浏览器实际产生的 FY、nonce、时间戳等值原样交给 Python 后，完整查询串逐字节一致。成功请求的 `bx-pp` 长 564 个字符，其中前 424 个字符与纯 Python PoW 在相同 nonce 和耗时下完全一致；后 140 个字符解码后为 `|<动态段>|<cna>`，动态段生成方法尚未确认。该记录没有在动态函数入口保存随机数和环境快照，所以尚不能用它证明 FY、nonce 或 ET 本地输出一致。

2026-10-21 又取得同一 `/slide` 类型的完整成功抓包：同页前两次校验返回 `code=300`，第三次返回 `code=0` 且响应含 `bx-x5sec`。Python 仍能逐字节重建查询串与 PoW 主体；成功请求的 `bx-pp` 长 638 个十六进制字符，PoW 主体占前 426 个字符，其余 212 个字符未独立生成。这次记录了 FY、nonce、ET 调用的显式参数与调用内随机数，归档 JS 本地重放仍不等于浏览器值。此样本属于 `/slide`，不应用于判断 [`captchacapslidev2`](x5sec-scratch-2026-10-20.md) 的动态算法是否成功。

## 未完成的分析

以下按生成依赖列出剩余工作；[FY 模块分析](fy-module-analysis.md)保留了已确认的入口、配置及静态分析边界。

| 模块 | 待确认内容 | 当前状态 |
| --- | --- | --- |
| FY | `getFYToken` 与 `getUidToken` 对应的虚拟机入口、浏览器环境和拖动事件输入、编码前 payload、最终编码规则。 | [新分支](x5sec-scratch-2026-10-20.md)已有 Python 调用归档 JS 的本地 FY 输出；此 `/slide` 分支尚未通过服务端验证。 |
| nonce | 下游脚本如何注册 `crypto.genRandomValues`，以及如何用 `slidedata.n` 生成 `_rand`。 | 新分支已有本地 JS 运行时输出 160 字符值；此 `/slide` 分支尚未对齐。 |
| ET | `window.etSign` 如何处理完整 URL 并产生 `bx-et`。 | 新分支已有本地 JS 运行时输出；签名输入规范和此 `/slide` 分支的服务端结果未对齐。 |
| PoW | 将页面 `pp` 输入与 `bx-pp` 对齐。 | 纯 Python 已移植 MD5 搜索和主体编码；成功请求主体逐字节一致，140 字符附加段未还原。 |
| 端到端 | 用新挑战动态值产生完整请求，再确认 `result.code=0` 与 `bx-x5sec`。 | 仅有一次成功抓包；Python 明文字段与该抓包逐字节一致，动态模块未完成。 |

`NCAPPKEY`、`NCTOKENSTR`、`SECDATA` 是挑战页下发值，DOM 几何值来自当前页面；它们需要读取或传入，不属于待破解的本地生成算法。

## 响应

成功时返回 HTTP 200、`Content-Type: application/json;charset=UTF-8`，正文为：

```json
{"code":0,"dt":"success","ec":200,"result":{"code":0,"sig":"from bx"},"success":true}
```

同一响应的 `bx-x5sec` 响应头包含 `x5sec` 值及属性：

```http
bx-x5sec: x5sec=<动态值>; Max-Age=1786; Expires=<过期时间>; Domain=1688.com; Path=/; SameSite=None; Secure
```

`Max-Age=1786` 是本次观测值，不是固定有效期。成功后，浏览器 Cookie 中可见域名为 `.1688.com`、路径为 `/` 的 `x5sec`。

失败时同样返回 HTTP 200，正文为：

```json
{"code":300,"dt":"success","ec":200,"result":{"code":300,"sig":"from bx"},"success":true}
```

外层 `success: true` 和 HTTP 200 在成功、失败两种响应中都有。应以 `result.code` 判断本次滑动结果：`0` 为成功，`300` 为上述失败样例。
