"""`mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` 接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer"


class FulfillmentQuery(BaseModel):
    """商品履约配送方案查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    amount: PositiveInt = 1
    address_code: str = Field(default="440300", min_length=1)


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
