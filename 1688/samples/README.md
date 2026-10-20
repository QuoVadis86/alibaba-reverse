# 1688 接口样例

本目录收录 SDK 实际调用得到的 MTOP 请求业务参数和响应，方便在响应模型尚未完整定义时查看字段结构。

## 导航

- [样例文件](#样例文件)
- [样例格式与脱敏](#样例格式与脱敏)
- [通用响应字段](#通用响应字段)
- [业务字段速查](#业务字段速查)
- [状态与限制](#状态与限制)

## 样例文件

每个 JSON 文件按 MTOP API 分组；同一 API 的多个方法放在同一文件中。响应样例保留实际接口返回的结构，成功或失败状态以 `response.ret` 为准。

| 样例文件 | MTOP API | 覆盖方法 |
| --- | --- | --- |
| [`responses/product-detail.json`](responses/product-detail.json) | `mtop.1688.laputa.miniod` | 商品详情 |
| [`responses/sku-selector.json`](responses/sku-selector.json) | `mtop.1688.wosc.queryOfferSkuSelectorModel` | SKU 规格、价格与库存 |
| [`responses/mmga-offerdetail-service.json`](responses/mmga-offerdetail-service.json) | `mtop.1688.mmga.offerdetail.service` | AB 配置、物流、推荐商品、店铺关系、评价卡片 |
| [`responses/trade-mtop-rate-service.json`](responses/trade-mtop-rate-service.json) | `mtop.1688.trade.service.MtopRateService` | 商品评价、DSR |
| [`responses/freight-info-service.json`](responses/freight-info-service.json) | `mtop.1688.freightInfoService.getFreightInfoWithScene` | 运费 |
| [`responses/fulfillment-solution.json`](responses/fulfillment-solution.json) | `mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` | 履约配送方案 |
| [`responses/shop-card.json`](responses/shop-card.json) | `mtop.1688.moga.pc.shopcard` | 店铺卡片 |
| [`responses/shop-module-async-service.json`](responses/shop-module-async-service.json) | `mtop.alibaba.alisite.cbu.server.ModuleAsyncService` | 店铺头部、认证、商品列表 |
| [`responses/wireless-recommend.json`](responses/wireless-recommend.json) | `mtop.relationrecommend.WirelessRecommend.recommend` | 商品搜索、筛选配置、企业搜索、图片搜索和图片上传 |
| [`responses/user-simple.json`](responses/user-simple.json) | `mtop.user.getUserSimple` | 当前会话用户信息接口的会话失效响应；不保存用户资料 |

## 样例格式与脱敏

- `api`、`version` 和 `http_method` 标明调用的接口及 HTTP 方法。
- `request.data` 是 SDK 发送的业务入参；不包含 Cookie 请求头、令牌或动态签名。接口把 JSON 放在字符串字段（例如 `params`）时，样例会将其解开，便于阅读。
- `response` 是 SDK 解析 JSONP 后得到的真实 MTOP 响应对象，包含服务端返回的 `ret`、`data` 等字段。
- Cookie、令牌、验证码挑战 URL、请求级追踪标识已脱敏；图片上传请求中的 Base64 图片内容以说明文本代替。
- 样例里的商品和店铺字段来自公开商品页面。不要把个人 Cookie、账号信息或未经授权取得的数据补进样例。

## 通用响应字段

| 字段 | 含义 |
| --- | --- |
| `api` | 响应对应的 MTOP API 名称。 |
| `v` | 接口版本。 |
| `ret` | 服务端状态码和说明；以是否包含 `SUCCESS` 或 `SUCCESS::...` 判断 MTOP 调用成功。 |
| `data` | 业务响应内容。不同 API 的层级和字段差异较大，当前按原始 JSON 保存。 |
| `traceId` | 服务端请求追踪标识；样例中使用脱敏占位值。 |

## 业务字段速查

以下是样例里常见字段的初步含义，帮助阅读真实响应。未列出的动态字段暂不推断；后续会结合更多响应补全 Pydantic 响应模型和字段注释。

| API/响应路径 | 字段 | 初步含义 |
| --- | --- | --- |
| 商品详情 `data.model.offerModel.offerDetail` | `offerId`、`subject`、`status` | 商品 ID、标题和商品状态。 |
| 同上 | `imageList`、`mainImageList` | 商品图片集合及主图集合。 |
| 商品详情 `data.model.dataModel` | 各组件键及其 `fields`、`meta` | 详情页动态组件的数据、组件元信息。 |
| SKU `data.skuSelectorBizModel` | `skuProps` | SKU 规格维度，例如颜色、尺码。 |
| 同上 | `skuInfoMap`、`originalSkuInfoMap` | 按规格组合索引的 SKU 信息；具体子字段以样例为准。 |
| 同上 | `skuSelectorModel` | SKU 选择器使用的商品、交易和运费等页面数据。 |
| MMGA 详情服务 | 请求中的 `mmgaRequest.serviceName` | 选择同一 API 下的具体业务方法。 |
| 运费接口 | `sendAddressCode`、`receiveAddressCode` | 发货地和收货地区编码。 |
| 同上 | `skuCalParams` | SKU 与购买数量组成的 JSON 数组。 |
| 同上 | `extendMap` | 重量、运费模板、卖家等扩展计算参数。 |
| 店铺异步模块 | `componentKey`、`params.memberId` | 选择店铺页面组件及其店铺成员标识。 |
| 企业/商品搜索 | `params.method`、`keywords`、`beginPage`、`pageSize` | 搜索类型、关键词、页码和每页数量。 |
| 企业搜索 | `pageId`、`searchScene`、`verticalProductFlag` | 搜索页生成的上下文标识、搜索场景和垂直业务类型。 |
| 企业/商品搜索 | `data.OFFER.items`、`hasMore`、`found` | 商品结果集合、是否还有后续页及匹配数量信息。 |
| 搜索筛选配置 | `data.filterData`、`pageConfigData` | 筛选项和搜索页面配置。 |
| 商品评价 | `offerId`、`beginPage`、`pageSize`、`starLevel` | 商品 ID、分页位置、每页数量和评价星级筛选。 |
| DSR 评分 | `offerId`、`scene` | 商品 ID 和评分查询场景。 |
| 履约配送 | `offerId`、`amount`、`addressCode` | 商品 ID、购买数量和收货地区编码。 |
| 店铺卡片 | `sellerUserId`、`sellerMemberId`、`winportUrl` | 卖家数字 ID、成员 ID 和店铺首页地址。 |
| 图片搜索 | `imageAddress`、`imageId` | 图片 URL 或先上传图片后取得的图片标识。 |

## 状态与限制

样例是特定时间、商品、店铺、请求参数和会话下的真实响应快照，不代表接口永久稳定。部分接口可能返回参数错误、会话过期或验证挑战；这类响应也保留在相应样例中，挑战 URL 已脱敏。`MtopResponse.data` 尚未为所有 API 建立专用模型，调用方应先检查 `success` 和 `ret`，再按样例读取动态字段。
