# 1688

本目录整理 1688 MTOP 接口分析资料，并提供 Python SDK。`services/` 按业务域和能力组织，目录最多两层；完整 MTOP API 名称保存在实现中。已确认字段的入参使用模型校验，尚未确认字段结构的业务响应保留为 JSON。

## 导航

- [安装与运行环境](#安装)
- [Cookie、令牌与验证挑战](#cookie令牌与验证挑战)
- [滑块校验：参数、模块与本地管线](docs/x5sec.md)
- [Python SDK 使用](#python-sdk)
- [接口索引与目录结构](#接口路径和代码组织)
- [真实请求与响应样例](samples/README.md)
- [s.1688.com HAR 接口清单](docs/s-1688-har-interfaces.md)
- [商品详情与店铺 HAR 接口清单](docs/detail-shop-har-interfaces.md)
- [PC 首页 JS 新发现的 MTOP 接口](docs/homepage-js-mtop.md)
- [使用边界](#使用边界)

## 目录

- [`api/`](api/)：客户端、传输层、响应模型和命令行入口。
- [`core/`](core/)：MTOP 签名与 x5sec 参数生成算法。
- [`services/`](services/)：按 MTOP 接口路径组织的业务服务。
- [`docs/`](docs/)：签名算法和接口说明。
- [`samples/`](samples/)：经脱敏和审查的示例数据。
- [`tools/`](tools/)：挑战链接采集等可复用脚本。
- [`pyproject.toml`](pyproject.toml)：依赖、打包配置和 CLI 入口。

## 安装

需要 Python 3.12 或更新版本以及 [uv](https://docs.astral.sh/uv/)。在仓库根目录执行，先确认所选 Python 构建使用的是已验证的 OpenSSL：

```bash
PYTHON_BIN=/path/to/compatible/python
"$PYTHON_BIN" -c 'import ssl; print(ssl.OPENSSL_VERSION)'
cd 1688
uv venv --python "$PYTHON_BIN" .venv
uv sync --python "$PYTHON_BIN" --locked
```

`PYTHON_BIN` 应指向下表中已验证成功的 Python 解释器。Python 自带的 `ssl` 模块会显示该解释器构建所使用的 OpenSSL；仅选择 Python 主次版本号并不能保证 OpenSSL 版本符合要求。虚拟环境放在 `1688/` 项目目录，安装完成后可直接运行 CLI 查询 SKU：

```bash
./.venv/bin/mtop-1688 566344866833
```

依赖由 `pyproject.toml` 声明，并通过 [`uv.lock`](uv.lock) 固定开发环境的完整解析结果。SDK 使用 Pydantic 2、Requests 2 和 Typer 0.x；安装时会自动解析兼容版本。

### 已验证的运行环境

以下组合使用同一接口和依赖版本（Requests 2.34.2、urllib3 2.8.0、Pydantic 2.14.1）进行过真实请求：

| Python | OpenSSL | 结果 |
| --- | --- | --- |
| 3.12.2 | 3.6.2 | 成功 |
| 3.12.10 | 3.6.2 | 成功 |
| 3.12.10 | 4.0.3 | 成功 |
| 3.12.10 | 3.0.16 | 服务端返回风控响应 |
| 3.13.3 | 3.6.2 | 成功 |
| 3.14.3 | 3.6.2 | 成功 |
| 3.13.3 | 3.0.16 | 服务端返回风控响应 |

同一 Python 3.12.10 版本的测试构建中，OpenSSL 3.6.2 和 4.0.3 成功，3.0.16 返回风控；同为 Python 3.13.3 的两种构建也呈现相同趋势。因此当前支持范围按已验证的 Python/OpenSSL 组合列出，证据指向 OpenSSL/TLS 客户端环境，而非 Python 版本号本身。风控响应不代表依赖安装或 SDK 调用失败；接口是否放行仍由服务端决定。

### Cookie、令牌与验证挑战

没有已有 Cookie 时，客户端会先从阿里统计端点初始化 `cna`，再对目标接口用 `undefined` 签名发送空请求，并从响应头读取 `_m_h5_tk`；后续接口会复用该令牌。若目标接口不下发令牌，再尝试通用引导接口。

传输层能够识别带挑战 URL 的 `FAIL_SYS_USER_VALIDATE` 响应，并预留了 `x5sec` 加载入口；若加载器返回 Cookie 值，会设置 `x5sec` 并重试一次。目前加载器的具体实现仍为 TODO，SDK 不会自动完成验证码或风控挑战。命令行可通过 `MTOP_COOKIE` 环境变量提供已获授权的 Cookie，Python 客户端也可在 `MtopClient(http, cookie_string)` 中传入。请勿把 Cookie 或令牌提交到仓库。

滑块校验的参数、模块、本地管线与验证边界见 [`docs/x5sec.md`](docs/x5sec.md)。对应的 JS 样本保存在 [`docs/reference/`](docs/reference/)，已确认的明文字段可用 [`core/x5sec/slide_params.py`](core/x5sec/slide_params.py) 构造。

`captcha`（`/slide`）链路已验证：浏览器只采集拖拽事件，`bx-pp` 由本地归档 VM 计算，验证请求由本地 Node 发出，服务端返回 `code=0` 并下发 `x5sec`。入口是 [`tools/pp_local_send.py`](tools/pp_local_send.py)。`captchacapslidev2` 分支、nonce/FY/ET 的独立生成和自造拖拽曲线仍未完成，SDK 暂不能独立完成挑战。

## Python SDK

```python
from api import MtopClient, OfferLogisticsQuery, create_http_client
from services.product.detail_extra import OfferRateCardInfoQuery
from services.product.shipping import FreightInfoQuery
from services.shop.modules import ShopOfferListQuery
from services.product.reviews import OfferRatingsQuery
from services.search.results import (
    CompanySearchQuery,
    TextSearchQuery,
)
from services.platform.experiment import AbtestQuery

with create_http_client() as http:
    client = MtopClient(http)

    # 获取商品详情
    detail = client.offer_detail.get(566344866605)
    logistics = client.product.detail_extra.get_logistics(
        OfferLogisticsQuery(offer_id=566344866605, seller_id=123456789)
    )
    freight = client.product.shipping.get(
        FreightInfoQuery(
            offer_id=0,
            seller_user_id=0,
            send_address_code="12954126",
            receive_address_code="440300",
            sku_id="6210992562870",
            sku_weight=888,
            seller_login_id="店铺登录名",
            template_id=10693676,
        )
    )
    rate_card = client.product.detail_extra.get_rate_card_info(
        OfferRateCardInfoQuery(
            offer_id=1048748734813,
            seller_login_id="店铺登录名",
            seller_member_id="店铺 memberId",
        )
    )
    ratings = client.product.reviews.get_ratings(
        OfferRatingsQuery(offer_id=566344866605)
    )
    results = client.search.results.search_text(
        TextSearchQuery(keywords="收纳盒")
    )
    hot_keywords = client.search.results.get_hot_keywords()
    search_initial_data = client.search.results.get_initial_data()
    experiment = client.platform.experiment.execute(
        AbtestQuery(
            abtest_code="5382",
            level1_biz="search",
            level2_biz="image",
            level3_biz="pc",
        )
    )
    companies = client.search.results.get_company_list(
        CompanySearchQuery(keywords="减肥神器", page_id="从企业搜索页读取的 pageId")
    )
    shop_offers = client.shop.modules.get_offer_list(
        ShopOfferListQuery(
            member_id="b2b-2222311704593bd41a",
            keywords="板凳",
            shop_url="https://shop.example.1688.com",
        )
    )
```

所有 MTOP 接口返回 `MtopResponse[T]`，通过 `success`、`ret`、`data` 读取状态和业务数据，通过 `raw` 查看完整响应。商品详情将稳定的 `offerDetail`、`dataModel` 等外层整理为 `OfferDetailData`；动态商品字段和其他接口的响应暂保留为 JSON。

`p_index.js` 和 `461.js` 中新确认的普通 MTOP 请求已按业务能力放入 `home`、`search`、`recommend`、`ai`、`trade`、`platform` 等模块。未确认字段的接口在所属模块用 `call(api, data)` 传入页面原始 JSON；完整清单和入口见 [PC 首页 JS MTOP 清单](docs/homepage-js-mtop.md)。

## 接口路径和代码组织

服务模块按业务域和能力组织，例如 `mtop.1688.mmga.offerdetail.service` 位于 `services/product/detail_extra.py`，`mtop.cbu.pc.smart.engine.api.abtest.execute` 位于 `services/platform/experiment.py`。下面列出已有专用参数模型的接口：

| API 路径 | SDK 调用 | 用途 |
| --- | --- | --- |
| `mtop.1688.laputa.miniod` | `client.product.detail.get(offer_id)` | 获取商品详情和详情页数据模型 |
| `mtop.1688.mmga.offerdetail.service` | `client.product.detail_extra.get_config(...)` | 查询详情页 AB 配置 |
| 同上 | `get_favorite_count(offer_id)` | 查询商品收藏数量（`offerFavoriteService`） |
| 同上 | `get_logistics(...)` | 查询商品物流时效与保障信息 |
| 同上 | `get_recommendations(offer_id)` | 获取商品详情页推荐商品 |
| 同上 | `get_shop_relation(...)` | 查询当前会话与店铺的关注关系 |
| 同上 | `get_rate_card_info(...)` | 获取详情页评价卡片汇总信息 |
| 同上 | `get_subscription(...)` / `get_ai_index(...)` / `get_barcode(...)` / `get_sell_points(...)` / `get_decision_attributes(...)` / `get_delivery_time(...)` / `get_similar_offers(...)` | 查询详情页订阅、AI、条码、卖点、决策属性、发货时间与相似同款 |
| `mtop.1688.wosc.queryOfferSkuSelectorModel` | `client.product.sku.get(offer_id)` | 获取商品 SKU 规格、价格和库存 |
| `mtop.1688.moga.pc.shopcard` | `client.shop.card.get(...)` | 获取店铺名称、评分和粉丝等卡片信息 |
| 同上 | `get_from_detail(...)` | 使用详情页完整商品和卖家上下文查询店铺卡片 |
| `mtop.1688.freightInfoService.getFreightInfoWithScene` | `client.product.shipping.get(...)` | 查询指定地区和购买数量对应的商品运费 |
| `mtop.1688.handPriceService.calculatePrice` | `client.product.price.calculate(...)` | 按 SKU、数量和地址计算订单价格 |
| `mtop.1688.marketing.coupon.batchApplyCoupon` | `client.marketing.coupon.batch_apply(...)` | 批量领取商品优惠券 |
| `mtop.1688.protect.MtopRecommendService.ptsRecommendForOfferV1` | `client.product.delivery.get_delivery_info(...)` | 查询预计发货或配送信息 |
| `mtop.1688.buyertoos.favorite.addoffer` / `deleteoffer` | `client.account.favorite.add_offer(...)` / `delete_offer(...)` | 收藏或取消收藏商品 |
| `com.alibaba.china.buy.service.favorite.MtopFavoriteService.queryFavoriteStatus` | `client.account.favorite_status.get(offer_id)` | 查询商品收藏状态；页面通过 MTOP 适配器调用 |
| `mtop.1688.fcaonefassapiservice.invoke` | `client.account.member.get_member_info()` | 查询会员基础信息 |
| `mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` | `client.trade.fulfillment.get(...)` | 查询指定地区和数量的履约配送方案 |
| 同上 | `get_from_detail(...)` | 使用详情页商品、类目和地址上下文查询履约方案 |
| `mtop.alibaba.alisite.cbu.server.ModuleAsyncService` | `client.shop.modules.get_header(...)` / `get_certification(...)` / `get_offer_list(...)` | 获取店铺头部、认证信息和商品列表模块 |
| `mtop.relationrecommend.WirelessRecommend.recommend` | `client.search.results.get_company_list(...)` | 按关键词获取企业/工厂搜索结果 |
| 同上 | `search_text(...)` / `get_config(...)` / `search_by_image(...)` | 关键词搜商品、查询搜索筛选项和以图搜同款 |
| 同上 | `get_hot_keywords()` / `get_home_experiments()` / `get_initial_data()` | 获取搜索框热词、首页找工厂推荐实验配置、搜索页初始配置 |
| 同上 | `get_input_hot_keywords()` | 获取搜索框输入热词；`get_hot_keywords(...)` 也支持详情页和店铺的场景参数 |
| `mtop.cbu.pc.smart.engine.api.abtest.execute` | `client.platform.experiment.execute(...)` | 查询指定业务场景的实验配置；HAR 中的 `5382` 样例返回配置不存在 |
| `mtop.1688.trade.service.MtopRateService.queryItemRatedListV2` / `queryDsrRateDataV2` | `client.product.reviews.get_ratings(...)` / `get_dsr(...)` | 查询商品评价列表和描述、物流、服务评分 |
| 同上 | `get_ratings_from_detail(...)` / `get_dsr_from_detail(...)` | 使用详情页评价参数查询 |
| `mtop.1688.trade.receiveaddress.queryReceiveAddresses` | `client.trade.address.query_receive_addresses()` | 查询登录用户的收货地址 |
| `mtop.1688.IpRegionQueryService.queryIpInfo` | `client.platform.region.query_ip_info()` | 查询当前 IP 地区 |
| `mtop.1688.pc.plugin.placement.decision.batchget` | `client.product.placement.batchget(...)` | 批量查询详情页插件位点配置 |
| `mtop.alisite.cbu.winport.sync.moduledata.get` | `client.shop.widgets.get_header(...)` / `get_discount_information(...)` / `get_coupon_banner(...)` | 查询店铺头部、折扣与优惠券组件 |
| `mtop.user.getUserSimple` | `client.account.user.get()` | 获取当前登录会话对应的用户基本信息 |

```text
services/
├── account/    # 用户、会员、收藏
├── ai/         # 助手、对比、需求、画像
├── home/       # 首页卡片、信息流、导航
├── marketing/  # 优惠券
├── platform/   # 实验、网关、地区
├── product/    # 详情、SKU、价格、运费、评价
├── recommend/  # 推荐池与推荐流
├── search/     # 关键词、图片、类目搜索
├── shop/       # 店铺卡片和组件
└── trade/      # 购物车、订单、地址、履约
```

常用旧入口的迁移对照：

| 旧入口 | 新入口 |
| --- | --- |
| `client.laputa.miniod` | `client.product.detail` |
| `client.mmga.offerdetail` | `client.product.detail_extra` |
| `client.wosc.queryofferskuselectormodel` | `client.product.sku` |
| `client.relationrecommend.wirelessrecommend` | `client.search.results` |
| `client.cbu.pc.smart.engine.api.abtest` | `client.platform.experiment` |
| `client.alibaba.alisite.cbu.server.moduleasyncservice` | `client.shop.modules` |

旧的路径镜像 Python 模块已移除；直接导入服务类或入参模型的代码也需改为对应的 `services/<业务域>/<能力>.py` 路径。

已建模接口的入参和响应模型与实现放在同一业务模块中，例如物流模型在 `services/product/detail_extra.py`，评价模型在 `services/product/reviews.py`。跨接口共用的 JSON 类型与 `MtopResponse` 位于 `api/response.py`。`client.offer_detail` 仍是 `client.product.detail` 的简写入口。

## 使用边界

客户端不会自动登录或求解验证码、风控挑战；目前只识别部分挑战响应并预留 `x5sec` 加载入口。部分接口要求有效登录态；业务响应也可能随账号、商品和服务端版本变化。请在获授权的范围内使用，并遵守目标平台规则及适用法律。
