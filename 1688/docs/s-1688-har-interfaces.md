# s.1688.com HAR 的 MTOP 接口清单

来源：`Downloads/aaaaaa/s.1688.com.har`，共 49 条网络记录。按 `/h5/mtop.../版本/` 路径筛选出 4 条 MTOP 请求，去重后为 2 个 API 路径、4 种请求体。以下只记录接口结构，不保存 HAR 中的 Cookie、签名、时间戳或追踪标识。

| API | 版本 | 次数 | 请求体中的业务调用 | SDK 入口 | HAR 响应 |
| --- | --- | ---: | --- | --- | --- |
| `mtop.relationrecommend.WirelessRecommend.recommend` | `2.0` | 1 | `appId=39799`, `params.method=shadeHotKeyword` | `client.search.results.get_hot_keywords()` | 成功 |
| 同上 | `2.0` | 1 | `appId=31250`, `params.pageName=findFactory`, `level2_biz=homeguess` | `get_home_experiments()` | 成功 |
| 同上 | `2.0` | 1 | `appId=32517`, `params.method=getInitialData` | `get_initial_data()` | 成功 |
| `mtop.cbu.pc.smart.engine.api.abtest.execute` | `1.0` | 1 | `abtestCode=5382`, `extraParams` 为 `search/image/pc` 场景 | `client.platform.experiment.execute(...)` | `CPSE-RPC-AB_TEST_ERROR`：实验配置不存在 |

这些请求均使用 POST，表单字段为 `data`，查询参数采用 `type=originaljson` 和 `dataType=jsonp`。AB 实验请求还带有 `ignoreLogin=true`、`prefix=h5api` 和 `jsonpIncPrefix=search1688`。接口封装按 HAR 重建请求；AB 实验代码 `5382` 在这份抓包中未返回有效配置，不能据此确认其他实验代码的成功响应结构。
