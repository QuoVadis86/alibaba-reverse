# PC 首页 JS 中的 MTOP 请求

来源：`/Users/meta001/Downloads/aaaaaa/p_index.js` 和 `461.js`。静态追踪请求调用点后，新接入 82 个普通 MTOP API，按业务能力分别放入 17 个模块。已有专用实现的 `mtop.cbu.pc.smart.engine.api.abtest.execute`、`mtop.relationrecommend.WirelessRecommend.recommend` 和 `mtop.user.getUserSimple` 不重复列入；大小写不同的 `WirelessRecommend.recommend` 算同一接口。`mtop.fc.cbutradefe.common2` 只在监控名单中出现，不是实际请求。

已确认 POST 的调用点设为 POST，其他接口使用页面封装器的 GET 默认值。默认版本为 1.0；按场景切换版本时，可用 `MtopCallOptions` 覆盖。清单来自静态代码分析，未逐项在线验证；成功与否取决于登录态、业务参数和服务端限制。

```python
from api import MtopClient, create_http_client
from services import MtopCallOptions
from services.platform.experiment import LoginExperimentQuery

with create_http_client() as http:
    client = MtopClient(http, cookie_string="已授权的 Cookie")
    suggestions = client.search.suggest.call(
        "mtop.1688.industry.pc.search.hotword",
        {},
    )
    categories = client.search.categories.call(
        "mtop.cbu.pc.web.api.cate.querycategories",
        {"categoryIds": "123,456"},
    )
    new_pool = client.recommend.pools.call(
        "mtop.1688.wirelesscenter.recommend.pc.getHotProductPoolId",
        {"appId": "42435", "params": {"serviceName": "HotProductPoolIdService"}},
        options=MtopCallOptions(version="2.0"),
    )
    experiment = client.platform.experiment.get_by_login(
        LoginExperimentQuery(scene_code="AI_MODE_FRAME")
    )
```

原始参数能力入口都提供 `list_endpoints()`，可枚举该模块的 API、默认方法和版本。未确认业务参数结构的接口用所属模块的 `call(api, data)` 传入页面原始 JSON；例如 `mtop.mbox.fc.common.gateway` 的 `params` 字段需要按调用场景构造 JSON 字符串。若查询参数或响应格式有差异，可传 `MtopCallOptions(extra_params=...)`。

2026-10-29 使用 OpenSSL 3.6.2 的匿名会话做了真实请求：`mtop.1688.pc.guide.show`、`mtop.1688.industry.pc.search.hotword`、`mtop.1688.wirelesscenter.recommend.pc.getAllCategory`、`mtop.cbu.pc.web.api.cate.querycategories`、`mtop.cbu.pc.home.midcontrol.listDoorsV2` 均返回 `SUCCESS`；已有搜索热词入口也返回 `SUCCESS`。`mtop.cbu.global.marketing.search.suggest` 按 JS 的 `{query: ...}` 入参调用时返回 `UNKNOWN_FAIL_CODE`，当前未确认是否需要额外页面上下文。其余接口尚未逐项在线验证。

## 新接入的普通接口

| API | 业务入口 | 默认方法 | 默认版本 |
| --- | --- | --- | --- |
| `com.alibaba.china.buy.service.purchase.MtopPurchaseService.addCargo` | `client.trade.cart.call(api, data)` | POST | 1.0 |
| `mtop.1688.bot.compare.add.cart.sku.id.get` | `client.ai.compare.call(api, data)` | GET | 1.0 |
| `mtop.1688.bot.compare.assistant.tab.detail.query` | `client.ai.compare.call(api, data)` | GET | 1.0 |
| `mtop.1688.bot.compare.detail.query` | `client.ai.compare.call(api, data)` | POST | 1.0 |
| `mtop.1688.bot.compare.product.switch` | `client.ai.compare.call(api, data)` | GET | 1.0 |
| `mtop.1688.bot.scene.adaptation` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.1688.industry.app.ai.sourcing.user.profile` | `client.ai.profile.call(api, data)` | GET | 1.0 |
| `mtop.1688.industry.pc.search.hotword` | `client.search.suggest.call(api, data)` | GET | 1.0 |
| `mtop.1688.mtoppurchaseservice.querypurchasehighlightskus` | `client.trade.cart.call(api, data)` | POST | 1.0 |
| `mtop.1688.next.abtest.result.getbylogin` | `client.platform.experiment.get_by_login(...)` | GET | 1.0 |
| `mtop.1688.opp.sel.aibot.querydownstreamperformance` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.1688.opp.sel.aibot.querysupportedcountries` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.ai.entrence.crowds.query` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.guide.show` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.aibot.compare.detail.query` | `client.ai.compare.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.aibot.guess` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.aibot.similar.query` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.aibot.supplier.risk.query` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.attention` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.default.recommend` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.entry.control` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.item.filter.query` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.item.list` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.item.similar.preview.query` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.notice.query` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.supplier.filter.query` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.pc.privatefeed.supplier.list` | `client.home.feed.call(api, data)` | GET | 1.0 |
| `mtop.1688.trading.dataline.service` | `client.trade.analytics.call(api, data)` | POST | 1.0 |
| `mtop.1688.wirelesscenter.recommend.getpokerirecomcard` | `client.recommend.pools.call(api, data)` | POST | 1.0 |
| `mtop.1688.wirelesscenter.recommend.pc.getAllCategory` | `client.recommend.pools.call(api, data)` | POST | 1.0 |
| `mtop.1688.wirelesscenter.recommend.pc.getHotProductPoolId` | `client.recommend.pools.call(api, data)` | POST | 1.0 |
| `mtop.ali.ww.cbu.web.gateway` | `client.platform.gateway.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.ai.native.feedback` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.ai.native.pc.init` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.bot.bubble.action.report` | `client.ai.assistant.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.bubble.get` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.bot.order.follow.detail.query` | `client.trade.order.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.order.follow.module.query` | `client.trade.order.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.order.follow.urge` | `client.trade.order.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.profile.country.search` | `client.ai.profile.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.bot.profile.get` | `client.ai.profile.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.bot.profile.guide.get` | `client.ai.profile.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.bot.profile.guide.report` | `client.ai.profile.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.profile.identity.update` | `client.ai.profile.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.profile.preference.update` | `client.ai.profile.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.cbu.bot.purchase.demand.task.list` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.global.alpha.bot.show` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.cbu.global.alpha.task.init` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.addorupdatebycate` | `client.ai.demand.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.all.bf.list` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.clarify.bf.list` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.editbyid` | `client.ai.demand.call(api, data)` | POST | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.getbyid` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.getbyitem` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.demand.satisfaction.get` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.global1688.silicon.bot.item.query` | `client.ai.demand.call(api, data)` | GET | 1.0 |
| `mtop.alibaba.tradedata.center.fastbuy.access` | `client.trade.cart.call(api, data)` | POST | 1.0 |
| `mtop.cbu.global.marketing.new.user.recommend.query` | `client.recommend.feeds.call(api, data)` | GET | 1.0 |
| `mtop.cbu.global.marketing.recommend.catepools.list` | `client.recommend.feeds.call(api, data)` | GET | 1.0 |
| `mtop.cbu.global.marketing.recommend.feeds` | `client.recommend.feeds.call(api, data)` | GET | 1.0 |
| `mtop.cbu.global.marketing.search.image.upload` | `client.search.image.call(api, data)` | GET | 1.0 |
| `mtop.cbu.global.marketing.search.suggest` | `client.search.suggest.call(api, data)` | GET | 1.0 |
| `mtop.cbu.national.cs.show.entry` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.national.multilang.pcindex.catelist` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.channels.api.getBizOpportunityChannelInfo` | `client.home.cards.call(api, data)` | POST | 1.0 |
| `mtop.cbu.pc.home.instantretail.getinstantretailhomecard` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.home.midcontrol.listDoorsV2` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.home.newarrival.queryNewArrival` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.home.newoffer.getNewOffersHomeCard` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.home.recommend.listCardsV2` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.newuser.listHomeCardOffers` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.tiansuo.engine.dialog.access` | `client.ai.assistant.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.cate.querycategories` | `client.search.categories.call(api, data)` | POST | 1.0 |
| `mtop.cbu.pc.web.api.data.recallData` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.home.getuserinfo` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.home.queryrankingoffers` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.home.slot.control` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.home.storeuserinfo` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.opportunity.getOpportunityHomeCard` | `client.home.cards.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.pop.querypreference` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.cbu.pc.web.api.pop.querypreferenceshow` | `client.home.navigation.call(api, data)` | GET | 1.0 |
| `mtop.mbox.fc.common.gateway` | `client.platform.gateway.call(api, data)` | GET | 1.0 |

## 暂未接入的流式接口

| API | 用途 |
| --- | --- |
| `mtop.1688.bot.compare.conclusion.stream` | 分块生成商品对比结论 |
| `mtop.relationrecommend.WirelessRecommend.recommendstream` | 分块返回推荐卡片 |

这两个接口依赖流式响应解析，本次按要求暂不实现。
