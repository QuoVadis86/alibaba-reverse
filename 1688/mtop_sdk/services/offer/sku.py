"""商品 SKU 接口。"""

from __future__ import annotations

from typing import Final

from mtop_sdk.models.common import MtopResponse
from mtop_sdk.transport import MtopRequest, MtopTransport

SKU_API: Final = "mtop.1688.wosc.queryOfferSkuSelectorModel"


class OfferSkuService:
    """查询商品 SKU 规格、价格和库存。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: str) -> MtopResponse:
        """查询一个商品的 SKU 信息。"""
        request = MtopRequest(
            api=SKU_API,
            version="1.0",
            method="POST",
            data={
                "offerId": offer_id,
                "useCase": "1688detail",
                "bizScene": "pcod",
                "urlParam": "actionType=dxOrder&sk=consign",
            },
        )
        return self._transport.request(request)
