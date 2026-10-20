"""商品接口服务集合。"""

from __future__ import annotations

from mtop_sdk.services.offer.detail import OfferDetailService
from mtop_sdk.services.offer.logistics import OfferLogisticsService
from mtop_sdk.services.offer.recommendations import OfferRecommendationsService
from mtop_sdk.services.offer.sku import OfferSkuService
from mtop_sdk.transport import MtopTransport


class OfferService:
    """商品服务集合，具体接口按功能拆分。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.sku = OfferSkuService(transport)
        self.detail = OfferDetailService(transport)
        self.logistics = OfferLogisticsService(transport)
        self.recommendations = OfferRecommendationsService(transport)
