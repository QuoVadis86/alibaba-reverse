# 1688

本目录整理 1688 MTOP 接口分析资料，并提供 Python SDK。`services/` 按 MTOP API 路径组织：同一 API 的具体方法集中在同一个文件中；入参使用模型校验，尚未确认字段结构的业务响应保留为 JSON。

## 目录

- [`mtop_sdk/`](mtop_sdk/)：SDK 源码。
- [`docs/`](docs/)：签名算法和接口说明。
- [`samples/`](samples/)：经脱敏和审查的示例数据。
- [`pyproject.toml`](pyproject.toml)：依赖、打包配置和 CLI 入口。

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

    detail = client.laputa.miniod.get(566344866605)
    logistics = client.mmga.offerdetail.get_logistics(
        OfferLogisticsQuery(offer_id=566344866605, seller_id=123456789)
    )
    ratings = client.trade.mtoprateservice.get_ratings(
        OfferRatingsQuery(offer_id=566344866605)
    )
    results = client.relationrecommend.wirelessrecommend.search_text(
        TextSearchQuery(keywords="收纳盒")
    )
```

所有 MTOP 接口返回 `MtopResponse[T]`，通过 `success`、`ret`、`data` 读取状态和业务数据，通过 `raw` 查看完整响应。商品详情将稳定的 `offerDetail`、`dataModel` 等外层整理为 `OfferDetailData`；动态商品字段和其他接口的响应暂保留为 JSON。

## 接口路径和代码组织

服务模块按照去掉 `mtop.` 后的 API 路径组织。例如 `mtop.1688.mmga.offerdetail.service` 对应 `services/mmga/offerdetail.py`，该文件包含详情配置、物流、商品推荐和店铺关系方法。

```text
services/
├── mmga/offerdetail.py                         # mtop.1688.mmga.offerdetail.service
├── laputa/miniod.py                            # mtop.1688.laputa.miniod
├── wosc/queryofferskuselectormodel.py          # mtop.1688.wosc.queryOfferSkuSelectorModel
├── moga/pc/shopcard.py                         # mtop.1688.moga.pc.shopcard
├── trade/mtoprateservice.py                    # 评价列表和 DSR
├── freightinfoservice.py                       # 运费
├── alibaba/carriagecenter/fulfillmentsolution.py
├── alibaba/alisite/cbu/server/moduleasyncservice.py
├── relationrecommend/wirelessrecommend.py      # 关键词和图片搜索
└── user/usersimple.py
```

`models/` 按业务数据组织，与 MTOP 服务路径分开。物流入参在 `models/offer/logistics.py`，搜索入参在 `models/search.py`。

## 使用边界

客户端不处理登录、验证码或风控挑战。部分接口要求有效登录态；业务响应也可能随账号、商品和服务端版本变化。请在获授权的范围内使用，并遵守目标平台规则及适用法律。
