"""商品物流时效接口。"""

from __future__ import annotations

from mtop_sdk.models import MtopResponse, OfferLogisticsQuery
from mtop_sdk.services.offer.detail.common import DETAIL_API, DETAIL_HEADERS
from mtop_sdk.transport import MtopRequest, MtopTransport


class OfferLogisticsService:
    """查询商品物流时效。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: OfferLogisticsQuery) -> MtopResponse:
        """根据商品和收发货信息查询物流时效。"""
        request = MtopRequest(
            api=DETAIL_API,
            version="1.0",
            method="POST",
            data={
                "mmgaRequest": {
                    "serviceName": "offerLogisticsService",
                    **query.model_dump(by_alias=True),
                }
            },
            headers=DETAIL_HEADERS,
        )
        return self._transport.request(request)
