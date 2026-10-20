"""商品评价列表接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.offer.ratings import OfferRatingsQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

RATINGS_API: Final = "mtop.1688.trade.service.MtopRateService.queryItemRatedListV2"


class OfferRatingsService:
    """查询商品评价分页列表。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: OfferRatingsQuery) -> MtopResponse[JsonValue]:
        """根据商品 ID 和分页条件获取评价。"""
        request = MtopRequest(
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
        return self._transport.request(request)
