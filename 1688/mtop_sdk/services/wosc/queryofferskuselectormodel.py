"""`mtop.1688.wosc.queryOfferSkuSelectorModel` 商品 SKU 接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.wosc.queryOfferSkuSelectorModel"


class OfferSkuService:
    """查询商品 SKU 规格、价格和库存。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: str) -> MtopResponse[JsonValue]:
        """查询一个商品的 SKU 信息。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": offer_id,
                    "useCase": "1688detail",
                    "bizScene": "pcod",
                    "urlParam": "actionType=dxOrder&sk=consign",
                },
            )
        )
