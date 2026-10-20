"""商品物流时效接口。"""

from __future__ import annotations

import json

from mtop_sdk.models.common import MtopResponse
from mtop_sdk.models.common import JsonValue
from mtop_sdk.models.offer.logistics import OfferLogisticsQuery
from mtop_sdk.services.offer.detail.common import DETAIL_API, DETAIL_HEADERS
from mtop_sdk.transport import MtopRequest, MtopTransport


class OfferLogisticsService:
    """查询商品物流时效。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: OfferLogisticsQuery) -> MtopResponse[JsonValue]:
        """根据商品和收发货信息查询物流时效。"""
        request = MtopRequest(
            api=DETAIL_API,
            version="1.0",
            method="POST",
            data={
                "mmgaRequest": {
                    "serviceName": "offerLogisticsService",
                    "invokeSource": "pc",
                    "channelType": "dsc",
                    "offerDeliveryTime": query.offer_delivery_time,
                    "offerId": query.offer_id,
                    "toAddressCode": query.to_address_code,
                    "fromAddressId": query.from_address_id,
                    "sellerId": query.seller_id,
                    "protectionInfos": json.dumps(
                        query.protection_infos,
                        ensure_ascii=False,
                        separators=(",", ":"),
                    ),
                    "buyerProtectionModel": json.dumps(
                        query.buyer_protection_model,
                        ensure_ascii=False,
                        separators=(",", ":"),
                    ),
                }
            },
            headers=DETAIL_HEADERS,
        )
        return self._transport.request(request)
