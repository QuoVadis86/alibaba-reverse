"""首页卡片 MTOP 接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec, MtopCallOptions

RAW_ENDPOINTS: Final = (
    EndpointSpec(
        "mtop.cbu.pc.channels.api.getBizOpportunityChannelInfo", method="POST"
    ),
    EndpointSpec("mtop.cbu.pc.home.instantretail.getinstantretailhomecard"),
    EndpointSpec("mtop.cbu.pc.home.midcontrol.listDoorsV2"),
    EndpointSpec("mtop.cbu.pc.home.newarrival.queryNewArrival"),
    EndpointSpec("mtop.cbu.pc.home.newoffer.getNewOffersHomeCard"),
    EndpointSpec("mtop.cbu.pc.home.recommend.listCardsV2"),
    EndpointSpec("mtop.cbu.pc.newuser.listHomeCardOffers"),
    EndpointSpec("mtop.cbu.pc.web.api.home.queryrankingoffers"),
    EndpointSpec("mtop.cbu.pc.web.api.opportunity.getOpportunityHomeCard"),
)


class OpportunityHomeCardQuery(BaseModel):
    """首页商机卡片分页条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    page_no: PositiveInt = 1
    page_size: PositiveInt = 10
    is_new: bool = False


class HomeCardService(EndpointGroup):
    """按首页脚本中的参数调用卡片接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_instant_retail(self, page_size: PositiveInt = 6) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.home.instantretail.getinstantretailhomecard",
            {"pageSize": page_size},
        )

    def list_doors(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.cbu.pc.home.midcontrol.listDoorsV2")

    def get_new_arrivals(
        self, page_num: PositiveInt = 1, page_size: PositiveInt = 40
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.home.newarrival.queryNewArrival",
            {"pageNum": page_num, "pageSize": page_size, "type": "today"},
            options=MtopCallOptions(extra_params={"valueType": "original"}),
        )

    def get_new_offers(
        self, page_num: PositiveInt = 1, page_size: PositiveInt = 8
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.home.newoffer.getNewOffersHomeCard",
            {"pageNum": page_num, "pageSize": page_size},
        )

    def list_recommend_cards(self, page_url: str) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.home.recommend.listCardsV2",
            {"otherParams": json.dumps({"url": page_url}, separators=(",", ":"))},
        )

    def list_new_user_offers(
        self,
        page_no: PositiveInt = 1,
        page_size: PositiveInt = 6,
        resource_id: PositiveInt = 4159437,
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.newuser.listHomeCardOffers",
            {"pageNo": page_no, "pageSize": page_size, "resourceId": resource_id},
        )

    def get_ranking_offers(
        self, offer_count: PositiveInt = 4
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.web.api.home.queryrankingoffers", {"offerCount": offer_count}
        )

    def get_opportunity(
        self, query: OpportunityHomeCardQuery = OpportunityHomeCardQuery()
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.web.api.opportunity.getOpportunityHomeCard",
            {
                "pageNo": query.page_no,
                "pageSize": query.page_size,
                "isNew": query.is_new,
            },
        )
