# 商品详情页接口分析

分析时间：2026-11-18。证据来自 Alibaba.com 当前 Chrome 商品详情页的网络记录（本地已清理 HAR，未放入仓库）及该页面实际加载的官方 JS：[`detail-fantasy/1.16.112/pc/index.js`](https://s.alicdn.com/@g/sc/detail-fantasy/1.16.112/pc/index.js)、[`product-specification.chunks.js`](https://s.alicdn.com/@g/sc/detail-fantasy/1.16.112/pc/product-specification.chunks.js)。样本商品 ID 为 `1601383590524`。以下是这个 PC 页面版本的观察结果，不等于所有地区、账号或版本的稳定协议。

## 主体详情：HTML 首屏数据

主请求是 `GET https://www.alibaba.com/product-detail/<商品名>_<productId>.html`。本次 HTTP 200 的 `text/html` 正文内包含：

```js
window.detailData = { /* JSON 对象 */ };
```

它是主体详情的数据载体。顶层为 `devData`、`globalData`、`hierarchy`、`metaData`、`nodeMap`。`globalData` 中有 `product`、`seller`、`buyer`、`inventory`、`trade`、`review`、`seo`、`extend` 等。商品字段覆盖 `productId`、`subject`、`mediaItems`、`price`、`moq`、`sku`、行业属性；卖家、库存、交易和评价摘要也在同一个对象内。`pc/index.js` 读取 `window.detailData` 并传给页面组件完成渲染。

因此，在这个样本中**没有观察到一个单独返回完整商品详情的 JSON/XHR 接口**。仅筛选 Fetch/XHR 会漏掉主数据。页面 HTML 本身就是本次可确认的完整详情入口，提取时应解析赋给 `window.detailData` 的 JSON，而不是把整段 HTML 当 JSON。

## 已观察到的附属数据请求

| 用途 | 方法与路径 | 参数 | 响应要点 |
| --- | --- | --- | --- |
| 图文描述 | `GET /event/app/mainAction/desc.htm` | `detailId`、`language` | `success=true`；`data.productHtmlDescription`、`productDescriptionType`、`productDescriptionPcPageId` |
| 物流试算 | `POST /event/app/productDetail/logistics.do` | JSON 正文 | `success=true`；`data.deliverInfo`、`dispatchRepositories`、`hasValidLogistics`、`leadTime` 等 |
| 详情页推荐 | `GET /event/app/detailRecommendProducts/allRecommendationList` | `productId`、`intentionId` | `code=200`；`data.floors`，样本有 3 个推荐楼层 |
| 装修内容 | `GET /event/app/productQuickDetail/releaseContent.htm` | `productId`、`terminalType`、`detailId` | 可解析为 JSON，含 `top.pcHtmlContent`；响应 MIME 为 `application/javascript` |
| 多商品摘要 | `GET /event/app/productsBrief/productsbrief.htm` | `ids`、`language`、`productId`、`detailId` | `isSuccess=true`；`data` 为商品摘要数组，样本有 12 条 |

`logistics.do` 的请求正文在样本中包含 `packageMode`、`orderSource`、`timeZone`、`language`、`shipToCountry`、`currencyCode`、`shipToZipCode`、`dispatchCountry`、`productId`、`quantity`、`skuQuantity`、`skuQuantityExpress`、`type`、`productTotalPrice`、`extendParam` 等。它依赖数量、SKU、收货地等上下文，不能仅凭 `productId` 当作静态详情接口。

`allRecommendationList` 的三个楼层类型分别为 `sameStoreRecommendationList`、`boughtTogetherRecommendationList`、`supplierPopularRecommendationList`。`productsbrief.htm` 只给摘要字段，如 `subject`、`pcDetailUrl`、`imageUrls`、`priceWithoutUnit`、`moq`，不是完整商品详情。`releaseContent.htm` 的样本同时出现 `success=false` 与 `isSuccess=true`；应按具体内容判定，不宜仅看一个成功标志。

## JS 中存在、此次未观察到调用的接口

- `GET /event/app/coupon/query?productId=<id>`：`pc/index.js` 中的优惠券查询。脚本读取响应 `data` 中的优惠券列表；此次网络记录无该调用。
- `GET /event/app/productDetail/signature`：`pc/index.js` 中的签名请求，供定制等流程使用；它不是商品详情数据接口，此次网络记录无该调用。

详情页的前端按需加载了多个 JS chunk；我还检查了主脚本列出的未加载 chunk（如优惠券、尺码表、AI 对比模块）。这些脚本中未发现另一个返回完整商品详情的固定 URL。这个结论只覆盖本次 `detail-fantasy/1.16.112` PC 资源及已记录的页面请求。

## 提取建议

1. 从搜索结果的 `productUrl` 访问详情 HTML。
2. 在 HTML 中定位 `window.detailData = `，按 JSON 对象边界解析其赋值；主体数据从 `globalData.product`、`seller`、`trade`、`inventory` 读取。
3. 按需补充 `desc.htm` 的图文描述和 `logistics.do` 的动态运费；推荐与多商品摘要是其他用途。

原始及已清理 HAR 均留在下载目录，仓库只记录路径、参数名、字段名和验证结论，不保存 Cookie、令牌或原始详情数据。

## SDK 实测补充

2026-11-18 使用本目录 SDK 无凭据调用时，`desc.htm` 返回 29056 字符图文描述，推荐接口返回 3 个楼层，`logistics.do` 用商品 ID、数量、收货国和币种等最小参数返回 `code=200`。`productsbrief.htm` 初次返回 `401 Referer not safe`；按页面实际请求加上 `/product-detail/description/descIframe.html?productId=<id>` 作为 Referer 后成功返回商品摘要。`releaseContent.htm` 也能独立返回装修内容。

同一环境直接访问详情 HTML 返回登录验证页；用这次真实详情 HAR 的 HTML 调用 `parse_detail_html` 可提取 `productId=1601383590524`、商品主题和卖家/交易数据。这表明解析逻辑对观察到的页面结构有效，但**不表示无会话客户端能稳定获取完整详情**。
