# 1688

本目录整理 1688 接口分析资料。目前包含 MTOP 请求签名算法，以及商品 SKU 和详情服务接口客户端。

## 目录

- [`docs/`](docs/)：算法说明和分析记录。
- [`tools/`](tools/)：可复用的本地分析工具。
- [`samples/`](samples/)：存放经过脱敏和审查的最小样例；目前没有原始流量样本。

## 当前内容

- [MTOP 签名算法](docs/mtop-signature.md)
- [签名计算模块](tools/mtop_sign.py)
- [MTOP 接口客户端](tools/mtop_client.py)：SKU 选择器、详情 AB 配置和物流时效子服务。

## 调用 SKU 接口

需要安装 [uv](https://docs.astral.sh/uv/)，然后运行：

```bash
uv run 1688/tools/mtop_client.py 566344866833
```

没有已有 Cookie 时，脚本会先使用 `undefined` 参与签名发起匿名引导请求，再从响应的 `Set-Cookie` 头读取 `_m_h5_tk`，然后请求 SKU 信息。也可以通过 `MTOP_COOKIE` 提供已授权的浏览器 Cookie；不要把 Cookie 写入仓库或命令历史。当前实现一次请求一个商品，不做批量请求、不处理验证码，也不会打印 Cookie 或令牌。

已安装脚本依赖的 Python 项目也可以导入客户端；把 `1688/tools/` 加入 `PYTHONPATH` 后调用 SKU 接口。若不需要浏览器 Cookie，可省略构造函数的第二个参数：

```python
from mtop_client import MtopClient, create_http_client

with create_http_client() as http:
    response = MtopClient(http).get_offer_sku("566344866833")
```

SDK 方法接收业务参数并负责组装 MTOP 请求：`get_offer_detail_config(ab_test_key)` 查询详情 AB 配置，`get_offer_logistics(query)` 查询物流时效。响应统一为 `MtopResponse`，通过 `result.success`、`result.ret` 和 `result.data` 读取状态与业务数据；完整原始响应可从 `result.raw` 获取。`OfferLogisticsQuery` 字段应使用获授权详情页请求中的真实值。

商品标题、图片和描述目前来自详情页 SSR 数据，尚未封装。
