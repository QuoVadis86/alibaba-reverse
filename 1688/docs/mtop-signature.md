# 1688 MTOP 签名算法

## 计算公式

```text
sign = lowercase_hex(MD5(UTF8(token + "&" + timestamp + "&" + appKey + "&" + data)))
```

当 token 缺失时，MTOP 的 JavaScript 签名代码会把 `undefined` 拼入原串，因此实际计算的是 `MD5("undefined&t&appKey&data")`；它不是空 token，也不是跳过签名。

参数说明：

- `token`：`_m_h5_tk` Cookie 值中第一个下划线之前的部分；没有 Cookie 时按 JavaScript 字符串转换规则使用 `undefined`。
- `timestamp`：参与请求的毫秒时间戳字符串。
- `appKey`：当前观察到的 1688 MTOP 应用标识；代码示例使用 `12574478`。
- `data`：签名使用的原始 JSON 字符串。序列化方式和字节内容必须与请求中的 `data` 一致；不要先做 URL 编码再签名。

## 本地计算

```python
from mtop_sign import AppKey, MtopSignInput, RequestData, TimestampMs, compute_sign

sign = compute_sign(
    MtopSignInput(
        token=None,  # 无 token 引导请求按 JavaScript 规则签入 "undefined"
        timestamp_ms=TimestampMs("1700000000000"),
        app_key=AppKey("12574478"),
        data=RequestData("{}"),
    )
)
```

实际导入时，将 `1688/tools/` 加入 `PYTHONPATH`，或从该文件所在目录导入 `mtop_sign`。

## 接入商品接口

`tools/mtop_client.py` 复用上述签名实现。没有已有 Cookie 时，客户端先对匿名引导接口使用 `token=None`（即签名串里的字面值 `undefined`），从响应头的 `Set-Cookie` 取得 `_m_h5_tk`，再发送目标请求。已有授权会话也可通过 `MTOP_COOKIE` 环境变量传入。命令行示例：

```bash
uv run 1688/tools/mtop_client.py 566344866833
```

不提供环境变量时会自动执行匿名引导。Cookie 是可选的；如需传入，请通过安全方式设置 `MTOP_COOKIE`，不要提交到仓库或写进命令历史。CLI 当前查询一个商品的 SKU；Python 客户端还封装了 `mtop.1688.mmga.offerdetail.service` 下已确认的详情子服务：`offerDetailPCABService` 和 `offerLogisticsService`。两者都通过 POST 调用，并附带 `_bx-login: new` 请求头：

```python
from mtop_client import MtopClient, create_http_client

with create_http_client() as http:
    client = MtopClient(http)
    response = client.request_offer_detail_service(
        "offerLogisticsService",
        {
            "offerId": "566344866833",
            "toAddressCode": "从详情页请求中读取",
            "fromAddressId": "从详情页请求中读取",
            "sellerId": "从详情页请求中读取",
            "protectionInfos": {},
            "buyerProtectionModel": {},
            "offerDeliveryTime": {},
        },
    )
```

示例中的文本是说明占位符，调用时须换成授权会话中采集到的真实值。`offerDetailPCABService` 需要的 `abTestKey` 也是动态值。响应保留 MTOP 原始 JSON 对象，业务错误通过 `ret` 字段查看。

完整标题、图片和描述主要由详情页 SSR 内容提供，当前未接入 HTML 解析；运费计算接口 `mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` 需要登录态，暂未封装。客户端不处理登录、验证码或风控挑战。

## 边界

签名算法只计算 `sign` 字段，不负责获取令牌、构造或发送请求、处理登录态或处理风控挑战。不同接口和客户端版本可能要求不同参数；使用前应核对获授权范围内的请求数据。
