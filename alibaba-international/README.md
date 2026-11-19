# 阿里巴巴国际站：HAR 中的 JSON 接口

商品详情页的 HTML 首屏数据、附属 JSON 请求及官方 JS 线索见 [商品详情页接口分析](product-detail.md)，机器可读清单见 [product-detail-requests.json](product-detail-requests.json)。

## Python SDK

本目录提供只读 SDK，覆盖商品搜索、详情 HTML、图文描述、物流试算、推荐商品、多商品摘要、装修内容，以及本次 HAR 中有用的页面配置接口。接口会随站点版本变化，字段模型保留未列出的响应字段。安装与使用：

```bash
cd alibaba-international
uv sync --python 3.12
uv run python - <<'PY'
from alibaba_international import AlibabaInternationalClient, LogisticsRequest

with AlibabaInternationalClient() as sdk:
    result = sdk.search("magic cube", page_size=3)
    print(result.model.offers[0].productId)
    print(len(sdk.get_description(1601383590524).data.productHtmlDescription))
    print(len(sdk.get_recommendations(1601383590524).data.floors))
    print(sdk.estimate_logistics(LogisticsRequest(
        productId=1601383590524,
        quantity=500,
        shipToCountry="CN",
        currencyCode="CNY",
        dispatchCountry="CN",
    )).data)
PY
```

`sdk.get_detail(offer.productUrl)` 读取详情 HTML 并解析 `window.detailData`。站点可能对无会话请求返回登录验证页；此时抛出 `ChallengeRequiredError`。已有页面 HTML 可直接交给 `parse_detail_html(html)`，也可以给 SDK 注入配置好会话的 `httpx2.Client`。SDK 不保存 Cookie 或令牌。`get_product_briefs` 会带详情页描述 iframe 的 Referer，这是该接口在本次验证中的必要上下文。

2026-11-18 实测：SDK 成功取到搜索结果、图文描述、推荐楼层、物流试算、多商品摘要、装修内容和五个页面配置接口；完整详情解析已用真实详情 HAR 正文验证。无会话直接请求详情页仍返回登录验证页。`uv run pytest -q` 为 5/5 通过，`uv run ruff check .` 与 `uv build` 均通过。

分析来源：`~/Downloads/www.alibaba.com.har`，共 378 条请求。按响应正文实际解析，41 条是 JSON，合并为 35 个“方法 + 路径”组合。本目录只提取其中有业务用途、且本次响应提供了有效数据或明确页面状态的 6 个接口。机器可读的参数名、响应字段名及 HAR 条目序号见 [har-useful-requests.json](har-useful-requests.json)。

| 优先级 | 方法与路径 | 用途 | 本次响应 |
| --- | --- | --- | --- |
| 核心 | `GET www.alibaba.com/search/api/proTextSearch` | 商品搜索 | `success=true`，`model.offers` 有 60 条商品 |
| 辅助 | `GET s.alicdn.com/@xconfig/header/subHeaderConfig` | 站点导航和页脚入口 | `subMenu`、`tradeAssurance`、`helpCenter` 等配置 |
| 辅助 | `GET cashier.alibaba.com/payment/ajaxQueryLocalizedLogo.json` | 支付与安全标识 | `data` 中有 `PAYMENT`、`SECURITY` 两组 |
| 辅助 | `GET biz.alibaba.com/lt-address/shipto/recommendShipTo` | 收货地推荐 | 返回 `hasRecommend` 等状态；本次没有推荐 |
| 辅助 | `GET biz.alibaba.com/contract/ajax/ajaxTaxHeaderEntrance.json` | 税务入口 | 返回 `show` 等状态；本次未显示入口 |
| 辅助 | `GET insights.alibaba.com/openservice/gatewayService` | 收藏组件开关 | `data.showFavoriteComponent` |

## 商品搜索

`proTextSearch` 是本份 HAR 中唯一返回商品列表的接口。请求使用 `query`、`page`、`pageSize` 等参数；抓包还带有 `from`、`keywordsTranslate`、`langident`、`llmIntentionType`、`multiProTest`、`newPro`、`proVersion`、`queryMultiIntentionType`，以及追踪/上下文参数 `requestId`、`startTime`、`intentionId`。本次观察值为 `page=1`、`pageSize=60`，不能据此认定哪些参数是服务端必填项。

响应主要结构为：

```text
success
model.offers[]              商品列表
model.filterData[]          筛选项
model.preSmartFilter        快捷筛选
model.paginationData        currentPage / totalPage / totalCount
model.globalCommonTrace     追踪信息
model.perfTraceInfo         性能信息
msgCode / msgInfo
```

商品对象包括 `productId`、`productUrl`、`multiImage`、`title`、`price`、`moq`、`companyName`、`companyId`、`supplierHref`、`countryCode`、`reviewScore` 等字段。完整字段名见 JSON 清单。`price` 和 `moq` 在本次响应中是字符串，解析时不要直接当数值。此样本的 `paginationData.totalCount` 为 `0`，同时 `offers` 有 60 条，因此不要用它单独判断总商品数。

## 其他接口的请求要点

- `ajaxQueryLocalizedLogo.json` 的查询参数为 `types`、`scene`、`buyerCountryCode`、`deviceType`；本次分别观察到 `SECURITY,PAYMENT`、`the-new-footer`、`CN`、`PC`。
- `recommendShipTo` 的 `json` 查询参数是 URL 编码的 JSON，本次解码后包含 `scene`、`exposureMethod` 两个字段。
- `gatewayService` 使用 `modelId`；本次为 `12717`，只证明该组件场景下的观察值。
- `ajaxTaxHeaderEntrance.json` 带 `_tb_token_`。清单仅记录参数名，不保存令牌值；这个接口的可调用性可能依赖当前会话。

## 未纳入的 JSON 请求

- `wendingSearch`、`bottomWendingSearch` 虽返回 HTTP 200 和 `success=true`，但 `model=null`，没有可提取的内容。
- 6 条 `acs.h.alibaba.com/h5/mtop.*` 响应均为 `FAIL_SYS_SESSION_EXPIRED`，没有成功业务样本。
- 登录环境检查返回 `success=false`；IM 权限检查返回 `false`。CSRF 获取、埋点上报、第三方风控，以及其余静态配置接口不属于这份业务接口清单。

清单只保存接口路径、参数名和响应字段名，不含 HAR 中的 Cookie、令牌、请求追踪值或原始响应正文。上述 HAR 清单来自一次历史抓包；SDK 中展示的最小请求参数另经过线上验证，不代表全部参数在所有地区与会话下均可用。
