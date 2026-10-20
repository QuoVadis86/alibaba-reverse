# 1688 MTOP 签名算法

## 计算公式

```text
sign = lowercase_hex(MD5(UTF8(token + "&" + timestamp + "&" + appKey + "&" + data)))
```

参数说明：

- `token`：`_m_h5_tk` Cookie 值中第一个下划线之前的部分。
- `timestamp`：参与请求的毫秒时间戳字符串。
- `appKey`：当前观察到的 1688 MTOP 应用标识；代码示例使用 `12574478`。
- `data`：签名使用的原始 JSON 字符串。序列化方式和字节内容必须与请求中的 `data` 一致；不要先做 URL 编码再签名。

## 本地计算

```python
from mtop_sign import AppKey, MtopSignInput, RequestData, TimestampMs, Token, compute_sign

sign = compute_sign(
    MtopSignInput(
        token=Token("token-value"),
        timestamp_ms=TimestampMs("1700000000000"),
        app_key=AppKey("12574478"),
        data=RequestData("{}"),
    )
)
```

实际导入时，将 `1688/tools/` 加入 `PYTHONPATH`，或从该文件所在目录导入 `mtop_sign`。

## 接入 SKU 接口

`tools/mtop_client.py` 复用上述签名实现，从已获授权的浏览器 Cookie 中读取 `_m_h5_tk`，然后签名并请求 SKU 接口。纯 HTTP 客户端的匿名初始化不一定能取得令牌，因此客户端不假设可以自动获取 Cookie。命令行示例：

```bash
export MTOP_COOKIE
uv run 1688/tools/mtop_client.py 566344866833
```

请在运行命令前通过安全方式设置 `MTOP_COOKIE`，不要把 Cookie 提交到仓库或写进命令历史。客户端当前只封装 `mtop.1688.wosc.queryOfferSkuSelectorModel`，每次调用查询一个商品。响应保留 MTOP 原始 JSON 对象，业务错误通过响应中的 `ret` 字段查看。

## 边界

签名算法只计算 `sign` 字段，不负责获取令牌、构造或发送请求、处理登录态或处理风控挑战。不同接口和客户端版本可能要求不同参数；使用前应核对获授权范围内的请求数据。
