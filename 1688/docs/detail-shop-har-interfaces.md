# 商品详情与店铺 HAR 的 MTOP 接口清单

来源：`Downloads/aaaaaa/detail.1688.com.har`（70 条记录）和 `Downloads/aaaaaa/shop2376t4l841517.1688.com.har`（64 条记录）。两份文件共有 38 条 MTOP 请求，按 URL 路径去重后为 11 个 API。此处只记录接口结构，不保存 Cookie、签名、时间戳或追踪标识。

| API 路径 | 抓包次数 | SDK 覆盖情况 |
| --- | ---: | --- |
| `mtop.1688.moga.pc.shopcard` | 1 | 已有 `get`；新增匹配详情页完整入参的 `get_from_detail` |
| `mtop.1688.trade.receiveaddress.queryReceiveAddresses` | 1 | 新增 `client.trade.receiveaddress.query_receive_addresses()`；抓包返回会话过期 |
| `mtop.1688.mmga.offerdetail.service` | 11 | 已有关注关系、评价卡片、AB 配置、推荐商品；新增订阅、AI 索引、条码、卖点、决策属性、发货时间、相似同款 |
| `mtop.1688.trade.service.MtopRateService.queryDsrRateDataV2` | 1 | 新增匹配详情页参数的 `get_dsr_from_detail` |
| `mtop.1688.trade.service.MtopRateService.queryItemRatedListV2` | 1 | 新增匹配详情页参数的 `get_ratings_from_detail` |
| `mtop.1688.IpRegionQueryService.queryIpInfo` | 1 | 新增 `client.ipregionqueryservice.query_ip_info()` |
| `mtop.1688.pc.plugin.placement.decision.batchget` | 1 | 新增 `client.pc.plugin.placement.decision.batchget(...)` |
| `mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` | 2 | 已有简化查询；新增匹配详情页完整入参的 `get_from_detail`；抓包返回会话过期 |
| `mtop.relationrecommend.WirelessRecommend.recommend` | 12 | 已有首页热词、实验配置、初始化数据；新增输入热词并支持详情页热词场景参数 |
| `mtop.alisite.cbu.winport.sync.moduledata.get` | 3 | 新增店铺头部、折扣信息、优惠券横幅 3 个组件方法；折扣请求使用 GET |
| `mtop.alibaba.alisite.cbu.server.ModuleAsyncService` | 4 | 已有店铺商品列表；无关键词请求现在省略 `keywords` 字段 |

这两份抓包中的收货地址和履约方案请求返回 `FAIL_SYS_SESSION_EXPIRED`，因此只能确认请求结构，不能确认成功时的业务响应结构。其他列出的 MTOP 请求在抓包中返回 `SUCCESS`。详情页的商品标签、卖家标识和类目信息应从当前商品上下文传入，SDK 不内置抓包中的具体值。
