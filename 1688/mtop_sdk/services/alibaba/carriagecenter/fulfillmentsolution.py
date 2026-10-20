"""`mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` 接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.offer.shipping import FulfillmentQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

API: Final = "mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer"


class FulfillmentSolutionService:
    """查询指定地区和购买数量的履约配送方案。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: FulfillmentQuery) -> MtopResponse[JsonValue]:
        """查询商品履约方案。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "amount": query.amount,
                    "addressCode": query.address_code,
                },
            )
        )
