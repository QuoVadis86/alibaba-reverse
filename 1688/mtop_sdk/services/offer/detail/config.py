"""商品详情页 AB 配置接口。"""

from __future__ import annotations

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.services.offer.detail.common import DETAIL_API, DETAIL_HEADERS
from mtop_sdk.transport import MtopRequest, MtopTransport


class OfferDetailConfigService:
    """获取商品详情页 AB 配置。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, ab_test_key: str) -> MtopResponse[JsonValue]:
        """根据 AB 测试键获取详情页配置。"""
        request = MtopRequest(
            api=DETAIL_API,
            version="1.0",
            method="POST",
            data={
                "mmgaRequest": {
                    "serviceName": "offerDetailPCABService",
                    "abTestKey": ab_test_key,
                }
            },
            headers=DETAIL_HEADERS,
        )
        return self._transport.request(request)
