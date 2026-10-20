# 1688

本目录整理 1688 MTOP 接口分析资料，并提供 Python SDK。`services/` 按 MTOP API 路径组织：同一 API 的具体方法集中在同一个文件中；入参使用模型校验，尚未确认字段结构的业务响应保留为 JSON。

## 导航

- [安装与运行环境](#安装)
- [Cookie、令牌与验证挑战](#cookie令牌与验证挑战)
- [滑块校验请求与响应](docs/x5sec-challenge.md)
- [Python SDK 使用](#python-sdk)
- [接口索引与目录结构](#接口路径和代码组织)
- [真实请求与响应样例](samples/README.md)
- [使用边界](#使用边界)

## 目录

- [`mtop_sdk/`](mtop_sdk/)：SDK 源码。
- [`docs/`](docs/)：签名算法和接口说明。
- [`samples/`](samples/)：经脱敏和审查的示例数据。
- [`pyproject.toml`](pyproject.toml)：依赖、打包配置和 CLI 入口。

## 安装

需要 Python 3.12 或更新版本以及 [uv](https://docs.astral.sh/uv/)。先确认所选 Python 构建使用的是已验证的 OpenSSL：

```bash
PYTHON_BIN=/path/to/compatible/python
"$PYTHON_BIN" -c 'import ssl; print(ssl.OPENSSL_VERSION)'
uv venv --python "$PYTHON_BIN" .venv
UV_PROJECT_ENVIRONMENT="$PWD/.venv" uv sync --project 1688 --python "$PYTHON_BIN" --locked
```

`PYTHON_BIN` 应指向下表中已验证成功的 Python 解释器。Python 自带的 `ssl` 模块会显示该解释器构建所使用的 OpenSSL；仅选择 Python 主次版本号并不能保证 OpenSSL 版本符合要求。虚拟环境放在仓库根目录，安装完成后可直接运行 CLI 查询 SKU：

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

滑块校验请求参数、来源、响应正文和 `bx-x5sec` 响应头见 [`docs/x5sec-challenge.md`](docs/x5sec-challenge.md)。对应的 JS 样本保存在 [`docs/reference/`](docs/reference/)，已确认的明文字段可用 [`mtop_sdk/slide_params.py`](mtop_sdk/slide_params.py) 构造。
FY 模块的调用链及 Python 移植进度见 [`docs/fy-module-analysis.md`](docs/fy-module-analysis.md)。

## Python SDK

```python
from mtop_sdk import MtopClient, OfferLogisticsQuery, create_http_client
from mtop_sdk.services.mmga.offerdetail import OfferRateCardInfoQuery
from mtop_sdk.services.freightinfoservice import FreightInfoQuery
from mtop_sdk.services.alibaba.alisite.cbu.server.moduleasyncservice import ShopOfferListQuery
from mtop_sdk.services.trade.mtoprateservice import OfferRatingsQuery
from mtop_sdk.services.relationrecommend.wirelessrecommend import (
    CompanySearchQuery,
    TextSearchQuery,
)

with create_http_client() as http:
    client = MtopClient(http)

    # 获取商品详情（laputa.miniod 是该 MTOP 接口的原始路径名）
    detail = client.offer_detail.get(566344866605)
    logistics = client.mmga.offerdetail.get_logistics(
        OfferLogisticsQuery(offer_id=566344866605, seller_id=123456789)
    )
    freight = client.freightinfoservice.get(
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
    rate_card = client.mmga.offerdetail.get_rate_card_info(
        OfferRateCardInfoQuery(
            offer_id=1048748734813,
            seller_login_id="店铺登录名",
            seller_member_id="店铺 memberId",
        )
    )
    ratings = client.trade.mtoprateservice.get_ratings(
        OfferRatingsQuery(offer_id=566344866605)
    )
    results = client.relationrecommend.wirelessrecommend.search_text(
        TextSearchQuery(keywords="收纳盒")
    )
    companies = client.relationrecommend.wirelessrecommend.get_company_list(
        CompanySearchQuery(keywords="减肥神器", page_id="从企业搜索页读取的 pageId")
    )
    shop_offers = client.alibaba.alisite.cbu.server.moduleasyncservice.get_offer_list(
        ShopOfferListQuery(
            member_id="b2b-2222311704593bd41a",
            keywords="板凳",
            shop_url="https://shop.example.1688.com",
        )
    )
```

所有 MTOP 接口返回 `MtopResponse[T]`，通过 `success`、`ret`、`data` 读取状态和业务数据，通过 `raw` 查看完整响应。商品详情将稳定的 `offerDetail`、`dataModel` 等外层整理为 `OfferDetailData`；动态商品字段和其他接口的响应暂保留为 JSON。

## 接口路径和代码组织

服务模块按照去掉 `mtop.` 后的 API 路径组织。例如 `mtop.1688.mmga.offerdetail.service` 对应 `services/mmga/offerdetail.py`。每个接口模块、入参模型和公开方法都提供中文 docstring；下面列出 SDK 当前已接入接口的用途，方便按业务查找：

| API 路径 | SDK 调用 | 用途 |
| --- | --- | --- |
| `mtop.1688.laputa.miniod` | `client.offer_detail.get(offer_id)`；路径名入口为 `client.laputa.miniod.get(offer_id)` | 获取商品详情和详情页数据模型 |
| `mtop.1688.mmga.offerdetail.service` | `client.mmga.offerdetail.get_config(...)` | 查询详情页 AB 配置 |
| 同上 | `get_logistics(...)` | 查询商品物流时效与保障信息 |
| 同上 | `get_recommendations(offer_id)` | 获取商品详情页推荐商品 |
| 同上 | `get_shop_relation(...)` | 查询当前会话与店铺的关注关系 |
| 同上 | `get_rate_card_info(...)` | 获取详情页评价卡片汇总信息 |
| `mtop.1688.wosc.queryOfferSkuSelectorModel` | `client.wosc.queryofferskuselectormodel.get(offer_id)` | 获取商品 SKU 规格、价格和库存 |
| `mtop.1688.moga.pc.shopcard` | `client.moga.pc.shopcard.get(...)` | 获取店铺名称、评分和粉丝等卡片信息 |
| `mtop.1688.freightInfoService.getFreightInfoWithScene` | `client.freightinfoservice.get(...)` | 查询指定地区和购买数量对应的商品运费 |
| `mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` | `client.alibaba.carriagecenter.fulfillmentsolution.get(...)` | 查询指定地区和数量的履约配送方案 |
| `mtop.alibaba.alisite.cbu.server.ModuleAsyncService` | `client.alibaba.alisite.cbu.server.moduleasyncservice.get_header(...)` / `get_certification(...)` / `get_offer_list(...)` | 获取店铺头部、认证信息和商品列表模块 |
| `mtop.relationrecommend.WirelessRecommend.recommend` | `client.relationrecommend.wirelessrecommend.get_company_list(...)` | 按关键词获取企业/工厂搜索结果 |
| 同上 | `search_text(...)` / `get_config(...)` / `search_by_image(...)` | 关键词搜商品、查询搜索筛选项和以图搜同款 |
| `mtop.1688.trade.service.MtopRateService.queryItemRatedListV2` / `queryDsrRateDataV2` | `client.trade.mtoprateservice.get_ratings(...)` / `get_dsr(...)` | 查询商品评价列表和描述、物流、服务评分 |
| `mtop.user.getUserSimple` | `client.user.usersimple.get()` | 获取当前登录会话对应的用户基本信息 |

```text
services/
├── mmga/offerdetail.py                         # mtop.1688.mmga.offerdetail.service
├── laputa/miniod.py                            # mtop.1688.laputa.miniod
├── wosc/queryofferskuselectormodel.py          # mtop.1688.wosc.queryOfferSkuSelectorModel
├── moga/pc/shopcard.py                         # mtop.1688.moga.pc.shopcard
├── trade/mtoprateservice.py                    # 评价列表和 DSR
├── freightinfoservice.py                       # 运费
├── alibaba/carriagecenter/fulfillmentsolution.py
├── alibaba/alisite/cbu/server/moduleasyncservice.py # 店铺头部、认证和商品列表组件
├── relationrecommend/wirelessrecommend.py      # 关键词和图片搜索
└── user/usersimple.py
```

各 API 的入参和响应模型与接口实现放在同一服务模块中，例如物流模型在 `services/mmga/offerdetail.py`，商品评价模型在 `services/trade/mtoprateservice.py`。跨接口共用的 JSON 类型和 `MtopResponse` 位于 `mtop_sdk/response.py`。`client.offer_detail` 是易读的商品详情业务入口，与 `client.laputa.miniod` 指向同一个服务对象；后者保留 MTOP API 路径结构，便于对照接口名。

## 使用边界

客户端不会自动登录或求解验证码、风控挑战；目前只识别部分挑战响应并预留 `x5sec` 加载入口。部分接口要求有效登录态；业务响应也可能随账号、商品和服务端版本变化。请在获授权的范围内使用，并遵守目标平台规则及适用法律。
