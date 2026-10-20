"""`mtop.1688.trade.service.MtopRateService` 的评价和 DSR 方法。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, PositiveInt

from mtop_sdk.response import JsonValue, MtopResponse
from mtop_sdk.transport import MtopRequest, MtopTransport

RATINGS_API: Final = "mtop.1688.trade.service.MtopRateService.queryItemRatedListV2"
DSR_API: Final = "mtop.1688.trade.service.MtopRateService.queryDsrRateDataV2"


class OfferRatingsQuery(BaseModel):
    """商品评价列表分页条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    page: PositiveInt = 1
    page_size: PositiveInt = 20
    star_level: str = "all"


class OfferDsrQuery(BaseModel):
    """商品 DSR 评分查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    scene: str = "dsc"


class MtopRateService:
    """商品评价列表和描述、物流、服务 DSR 评分。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_ratings(self, query: OfferRatingsQuery) -> MtopResponse[JsonValue]:
        """查询商品评价分页列表。"""
        return self._transport.request(
            MtopRequest(
                api=RATINGS_API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "beginPage": query.page,
                    "pageSize": query.page_size,
                    "starLevel": query.star_level,
                },
            )
        )

    def get_dsr(self, query: OfferDsrQuery) -> MtopResponse[JsonValue]:
        """查询商品 DSR 评分。"""
        return self._transport.request(
            MtopRequest(
                api=DSR_API,
                version="1.0",
                method="POST",
                data={"offerId": query.offer_id, "scene": query.scene},
            )
        )
