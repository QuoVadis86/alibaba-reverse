"""商品 DSR 评分接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.offer.ratings import OfferDsrQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

DSR_API: Final = "mtop.1688.trade.service.MtopRateService.queryDsrRateDataV2"


class OfferDsrService:
    """查询商品描述、物流和服务 DSR 评分。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: OfferDsrQuery) -> MtopResponse[JsonValue]:
        """根据商品 ID 和场景查询 DSR 评分。"""
        request = MtopRequest(
            api=DSR_API,
            version="1.0",
            method="POST",
            data={"offerId": query.offer_id, "scene": query.scene},
        )
        return self._transport.request(request)
