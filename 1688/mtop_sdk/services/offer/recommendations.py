"""商品详情页推荐商品接口。"""

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.services.offer.detail.common import DETAIL_API, DETAIL_HEADERS
from mtop_sdk.transport import MtopRequest, MtopTransport


class OfferRecommendationsService:
    """获取商品详情页中的相关商品推荐。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: int) -> MtopResponse[JsonValue]:
        """按商品 ID 查询主要推荐、相似商品等推荐数据。"""
        request = MtopRequest(
            api=DETAIL_API,
            version="1.0",
            method="POST",
            data={
                "mmgaRequest": {
                    "serviceName": "offerRecommendService",
                    "offerId": offer_id,
                }
            },
            headers=DETAIL_HEADERS,
        )
        return self._transport.request(request)
