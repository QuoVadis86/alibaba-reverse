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

安装 SDK 后，可直接导入签名模块：

```python
from mtop_sdk.sign import AppKey, MtopSignInput, RequestData, TimestampMs, compute_sign

sign = compute_sign(
    MtopSignInput(
        token=None,  # 无 token 引导请求按 JavaScript 规则签入 "undefined"
        timestamp_ms=TimestampMs("1700000000000"),
        app_key=AppKey("12574478"),
        data=RequestData("{}"),
    )
)
```

本地开发时可从仓库根目录安装：`python -m pip install -e ./1688`。

## 接入商品接口

`mtop_sdk/transport.py` 复用上述签名实现。没有已有 Cookie 时，传输层先对匿名引导接口使用 `token=None`（即签名串里的字面值 `undefined`），从响应头的 `Set-Cookie` 取得 `_m_h5_tk`，再发送目标请求。已有授权会话也可通过 `MTOP_COOKIE` 环境变量传入。CLI 命令示例：

```bash
uv run --project 1688 mtop-1688 566344866833
```

不提供环境变量时会自动执行匿名引导。Cookie 是可选的；如需传入，请通过安全方式设置 `MTOP_COOKIE`，不要提交到仓库或写进命令历史。接口按业务域和功能拆分到 `mtop_sdk/services/`。商品详情使用 `mtop.1688.laputa.miniod`；物流等详情页子服务通过 POST 调用，并附带 `_bx-login: new` 请求头：

```python
from mtop_sdk import MtopClient, OfferLogisticsQuery, create_http_client

with create_http_client() as http:
    client = MtopClient(http)
    response = client.offer.logistics.get(
        OfferLogisticsQuery(
            offer_id=566344866833,
            seller_id=123456789,
            to_address_code="440300",
        )
    )
    print(response.data)
```

物流入参中的卖家 ID 等字段应填写商品详情上下文中的实际值。详情 AB 配置使用 `client.offer.detail.get_config(ab_test_key)`。其他接口按领域挂载在 `client.reviews`、`client.shop`、`client.shipping`、`client.search` 和 `client.user`。接口方法返回统一的 `MtopResponse`：`success` 表示 MTOP 是否成功，`ret` 保存服务端状态码，`data` 是业务响应数据，`raw` 保留完整原始响应。

详情接口会解析 `offerDetail`、`dataModel` 等稳定外层字段；商品业务对象内部字段因商品类型而异，当前保留为 JSON。运费、履约等接口已封装，部分服务可能要求有效登录态。客户端不处理登录、验证码或风控挑战，接口调用被服务端拦截时保留服务端响应，不尝试绕过。

## 边界

签名算法只计算 `sign` 字段，不负责获取令牌、构造或发送请求、处理登录态或处理风控挑战。不同接口和客户端版本可能要求不同参数；使用前应核对获授权范围内的请求数据。
