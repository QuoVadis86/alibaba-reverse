"""AI 采购需求 MTOP 接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.opp.sel.aibot.querydownstreamperformance", method="POST"),
    EndpointSpec("mtop.1688.opp.sel.aibot.querysupportedcountries"),
    EndpointSpec("mtop.alibaba.cbu.bot.purchase.demand.task.list"),
    EndpointSpec(
        "mtop.alibaba.global1688.silicon.bot.demand.addorupdatebycate", method="POST"
    ),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.all.bf.list"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.clarify.bf.list"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.editbyid", method="POST"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.getbyid"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.getbyitem"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.satisfaction.get"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.item.query"),
)


class DownstreamPerformanceQuery(BaseModel):
    """详情页下游表现查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    item_id: PositiveInt
    identity_type: str | None = None
    platform_type: str | None = None
    country: str | None = None
    user_profile: JsonObject | None = None


class DemandTaskListQuery(BaseModel):
    """采购需求任务列表条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    filter: str = "ALL"
    sort: str = "DEFAULT"
    page_no: PositiveInt = 1
    demand_id: PositiveInt | None = None
    session_id: str | None = None


class BotItemQuery(BaseModel):
    """按类目查询 AI 商品列表的条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    cate_id: PositiveInt
    bot_bf_params: JsonObject
    page_num: PositiveInt = 1
    page_size: PositiveInt = 10
    exclude_item_ids: list[PositiveInt] = Field(default_factory=list)


class AiDemandService(EndpointGroup):
    """按页面调用点组装 AI 采购需求参数。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_downstream_performance(
        self, query: DownstreamPerformanceQuery
    ) -> MtopResponse[JsonValue]:
        payload: JsonObject = {"itemId": query.item_id, "source": "detail"}
        if query.identity_type:
            payload["identityType"] = query.identity_type
        if query.platform_type:
            payload["platformType"] = query.platform_type
        if query.country:
            payload["country"] = query.country
        if query.user_profile is not None:
            payload["userProfile"] = json.dumps(
                query.user_profile, ensure_ascii=False, separators=(",", ":")
            )
        return self.call("mtop.1688.opp.sel.aibot.querydownstreamperformance", payload)

    def get_supported_countries(self, platform_type: str) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.1688.opp.sel.aibot.querysupportedcountries",
            {"platformType": platform_type},
        )

    def list_tasks(
        self, query: DemandTaskListQuery = DemandTaskListQuery()
    ) -> MtopResponse[JsonValue]:
        payload: JsonObject = {
            "filter": query.filter,
            "sort": query.sort,
            "pageNo": query.page_no,
            "pageSize": 10,
        }
        if query.demand_id is not None:
            payload["demandId"] = query.demand_id
        if query.session_id is not None:
            payload["sessionId"] = query.session_id
        return self.call("mtop.alibaba.cbu.bot.purchase.demand.task.list", payload)

    def add_or_update_by_category(
        self, cate_id: PositiveInt, bot_bf_params: JsonObject
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.global1688.silicon.bot.demand.addorupdatebycate",
            {
                "cateId": cate_id,
                "botBfParams": json.dumps(
                    bot_bf_params, ensure_ascii=False, separators=(",", ":")
                ),
            },
        )

    def list_all_bf(self, cate_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.global1688.silicon.bot.demand.all.bf.list",
            {"cateId": cate_id},
        )

    def list_clarify_bf(self, cate_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.global1688.silicon.bot.demand.clarify.bf.list",
            {"cateId": cate_id},
        )

    def edit_by_id(
        self,
        demand_id: PositiveInt,
        operate_type: str,
        bot_bf_params: JsonObject | None = None,
    ) -> MtopResponse[JsonValue]:
        payload: JsonObject = {"demandId": demand_id, "operateType": operate_type}
        if bot_bf_params is not None:
            payload["botBfParams"] = json.dumps(
                bot_bf_params, ensure_ascii=False, separators=(",", ":")
            )
        return self.call("mtop.alibaba.global1688.silicon.bot.demand.editbyid", payload)

    def get_by_id(self, demand_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.global1688.silicon.bot.demand.getbyid",
            {"demandId": demand_id},
        )

    def get_by_item(self, item_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.global1688.silicon.bot.demand.getbyitem", {"itemId": item_id}
        )

    def get_satisfaction(self, item_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.global1688.silicon.bot.demand.satisfaction.get",
            {"itemId": item_id},
        )

    def query_items(self, query: BotItemQuery) -> MtopResponse[JsonValue]:
        payload: JsonObject = {
            "cateId": query.cate_id,
            "pageNum": query.page_num,
            "pageSize": query.page_size,
            "botBfParams": json.dumps(
                query.bot_bf_params, ensure_ascii=False, separators=(",", ":")
            ),
        }
        if query.exclude_item_ids:
            payload["excludeItemIds"] = json.dumps(
                query.exclude_item_ids, separators=(",", ":")
            )
        return self.call("mtop.alibaba.global1688.silicon.bot.item.query", payload)
