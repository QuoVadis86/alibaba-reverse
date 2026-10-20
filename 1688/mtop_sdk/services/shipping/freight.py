"""商品运费查询接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.offer.shipping import FreightInfoQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

FREIGHT_API: Final = "mtop.1688.freightInfoService.getFreightInfoWithScene"


class FreightInfoService:
    """查询指定收货地区和购买数量对应的商品运费。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: FreightInfoQuery) -> MtopResponse[JsonValue]:
        """查询商品运费信息。"""
        request = MtopRequest(
            api=FREIGHT_API,
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
        return self._transport.request(request)
