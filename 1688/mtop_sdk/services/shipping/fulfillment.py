"""商品履约配送方案接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.offer.shipping import FulfillmentQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

FULFILLMENT_API: Final = "mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer"


class FulfillmentService:
    """查询指定地区和购买数量的履约方案。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: FulfillmentQuery) -> MtopResponse[JsonValue]:
        """获取履约配送方案。"""
        request = MtopRequest(
            api=FULFILLMENT_API,
            version="1.0",
            method="POST",
            data={
                "offerId": query.offer_id,
                "amount": query.amount,
                "addressCode": query.address_code,
            },
        )
        return self._transport.request(request)
