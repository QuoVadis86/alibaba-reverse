"""`mtop.1688.freightInfoService` 运费接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from mtop_sdk.response import JsonValue, MtopResponse
from mtop_sdk.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.freightInfoService.getFreightInfoWithScene"


class FreightInfoQuery(BaseModel):
    """商品运费查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    to_address_code: str = Field(default="440300", min_length=1)
    scene: str = "dsc"
    amount: PositiveInt = 1


class FreightInfoService:
    """查询指定收货地区和购买数量对应的商品运费。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: FreightInfoQuery) -> MtopResponse[JsonValue]:
        """查询商品运费信息。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "toAddrCode": query.to_address_code,
                    "scene": query.scene,
                    "amount": query.amount,
                    "needOD": "true",
                },
            )
        )
