# 1688

本目录整理 1688 MTOP 接口分析资料，并提供 Python SDK。SDK 按业务域拆分接口，统一封装请求签名、令牌获取和响应状态；入参使用模型校验，尚未确认字段结构的业务响应保留为 JSON。

## 目录

- [`mtop_sdk/`](mtop_sdk/)：SDK 源码，业务服务按领域和接口拆分。
- [`docs/`](docs/)：签名算法和接口说明。
- [`samples/`](samples/)：经脱敏和审查的示例数据。
- [`pyproject.toml`](pyproject.toml)：项目依赖、打包配置和 CLI 入口。

## 安装

需要 Python 3.12 或更新版本以及 [uv](https://docs.astral.sh/uv/)：

```bash
python -m pip install -e ./1688
```

也可以从仓库根目录直接运行 CLI 查询 SKU：

```bash
uv run --project 1688 mtop-1688 566344866833
```

没有已有 Cookie 时，客户端会用 `undefined` 参与签名发起令牌引导请求，再从响应头读取 `_m_h5_tk`。也可以通过 `MTOP_COOKIE` 提供已授权的 Cookie。请勿把 Cookie 或令牌提交到仓库。

## Python SDK

```python
from mtop_sdk import MtopClient, OfferLogisticsQuery, create_http_client
from mtop_sdk.models.offer.ratings import OfferRatingsQuery
from mtop_sdk.models.search import TextSearchQuery

with create_http_client() as http:
    client = MtopClient(http)

    detail = client.offer.detail.get(566344866605)
    print(detail.data.offer_detail if detail.data else detail.ret)

    logistics = client.offer.logistics.get(
        OfferLogisticsQuery(offer_id=566344866605, seller_id=123456789)
    )
    print(logistics.data)

    ratings = client.reviews.list.get(OfferRatingsQuery(offer_id=566344866605))
    results = client.search.text.get(TextSearchQuery(keywords="收纳盒"))
```

所有 MTOP 接口返回 `MtopResponse[T]`，通过 `success`、`ret`、`data` 读取状态和业务数据，通过 `raw` 查看完整响应。商品详情将稳定的 `offerDetail`、`dataModel` 等外层整理为 `OfferDetailData`；商品字段和其他接口的动态响应暂保留 JSON，不臆造未观测到的字段。

## 接口分组

| 调用入口 | 接口 |
| --- | --- |
| `client.offer` | SKU、商品详情、详情页配置、物流时效、详情页推荐 |
| `client.reviews` | 商品评价、DSR 评分 |
| `client.shop` | 店铺卡片、店铺头部、认证信息、当前会话的店铺关注关系 |
| `client.shipping` | 运费、履约配送方案 |
| `client.search` | 关键词搜索、筛选配置、图片上传和以图搜图 |
| `client.user.simple` | 当前登录用户基本信息 |

每个具体接口独立放在 `mtop_sdk/services/<领域>/<接口>.py`；对应入参模型放在 `mtop_sdk/models/`。详情物流入参模型位于 `models/offer/logistics.py`，搜索模型位于 `models/search.py`。

## 使用边界

客户端不处理登录、验证码或风控挑战。部分接口要求有效登录态；实际业务响应也可能随账号、商品和服务端版本变化。请在获授权的范围内使用，并遵守目标平台规则及适用法律。
