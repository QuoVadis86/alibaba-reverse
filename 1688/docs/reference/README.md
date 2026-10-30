# 滑块校验 JS 样本

这些文件来自 2026-10-20 同一次滑块页面的网络响应，用于核对 [请求参数来源](../x5sec.md)。文件名记录当时加载的版本或 nonce；第三方脚本可能在后续发布中变化。

| 样本 | 原请求 URL | 与参数的关系 |
| --- | --- | --- |
| [`punishpage-0.1.129.js`](punishpage-0.1.129.js)；[原始字节文本](punishpage-0.1.129.js.raw.txt) | `https://g.alicdn.com/bsop-static/sufei-punish/0.1.129/build/punishpage.min.js` | `slidedata`、`x5secdata`、`ppt`、`_rand`、`landscape`、`ts`、版本号、`v`、请求头 |
| [`nc-1.97.2.js`](nc-1.97.2.js) | `https://g.alicdn.com/AWSC/nc/1.97.2/nc.js` | `slidedata` 内部字段、`ncbtn`、`ncSessionID`、FY 调用 |
| [`awsc-captcha-0.0.1.js`](awsc-captcha-0.0.1.js) | `https://g.alicdn.com/AWSC/CAPTCHA/0.0.1/awsc.js` | NC/FY 初始化入口 |
| [`fy-index1-2026-10-20.js`](fy-index1-2026-10-20.js) | `https://o.alicdn.com/seclab/f/index1.js` | `n`、`umidToken` 对应的 FY 模块 |
| [`et_f-1.83.8.js`](et_f-1.83.8.js)；[原始字节文本](et_f-1.83.8.js.raw.txt) | `https://g.alicdn.com/AWSC/et/1.83.8/et_f.js` | `window.etSign` 使用的 ET 模块 |
| [`nonce-loader-0e473074f301b974.js`](nonce-loader-0e473074f301b974.js) | `https://g.alicdn.com/secdev/entry/x/0e473074f301b974.js` | nonce 下游脚本加载入口 |
| [`nonce-payload-0e473074f301b974.js.b64`](nonce-payload-0e473074f301b974.js.b64) | `https://o.alicdn.com/secdev/storage-br/secaptcha/0e473074f301b974.js` | nonce 下游响应原始字节；含非 UTF-8 字节，以分块 Base64 保存 |
| [`punish-inline-vm-2026-10-21.js`](punish-inline-vm-2026-10-21.js)；[原始字节文本](punish-inline-vm-2026-10-21.js.raw.txt) | `/_____tmd_____/punish` 页面的内联脚本 | 写入 `_config_.ppSign` 的 VM；`captcha` 与 `captchacapslidev2` 的三次实测脚本相同 |
| [`punish-program-2026-10-21.wasm`](punish-program-2026-10-21.wasm) | `https://g.alicdn.com/sd/punish/0.0.4/program.wasm` | `ppSign` VM 调用的 PoW 模块 |

`.js` 文件供直接查阅。归档时格式化器改写了 `punishpage`、`et_f` 和 `punish-inline-vm` 的空白，因此它们另有 `.js.raw.txt` 版本。前两个原始字节文本去掉最后一个归档换行后，与网络响应逐字节一致；内联 VM 原始字节文本本身与采集结果一致。其余 `.js` 文件仅比原响应多一个末尾换行。下表 SHA-256 均针对网络响应或内联脚本的原始字节，而非格式化副本。

| 脚本 | 原响应 SHA-256 |
| --- | --- |
| `punishpage` | `8ed1e0a831f3bfb7c57413cc71c4a5ea995f73e35f5cafb248bf3bcd031c7698` |
| `nc` | `464db7d6539c0b1c323c2b641626b9072026da621c23d29dd85d6a263360a2a9` |
| `awsc` | `4b7bce58cf4558487e9ff439dac45ef50c4186abf63d491e4c7d5cd16744e776` |
| `fy` | `b735c02928bc1c4fab6121c6d3139f34675e6c24044eae169363e7c32864da62` |
| `et_f` | `0ab55e76a88a3662447e678025d70e9367eb0c0a5d14948440013c3670ad545d` |
| nonce loader | `b1a6640dc5438752b07da7f98934eace8b6d6783baf5bc3d3ccce2c8c3906ea5` |
| nonce payload | `f1183d28d8e794e8ae3fc1cbb0f24347c7d869394d004bba92b44ec09d357556` |
| punish inline VM | `aa0db1c9d336bf67fc9adde2d7450b671e100991bd6a00cba57f32171981ccdf` |
| punish program WASM | `0f9ce15381dd36741f2b545982f9baa2c4b9cc123be519aae26fe39368dea5bc` |

nonce payload 的每一行是独立 Base64 块。按行解码后顺序拼接即可得到原响应字节；不要先把所有行合并再一次解码。
