"""商品详情相关接口集合。"""

from __future__ import annotations

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.offer.detail.miniod import OfferDetailData
from mtop_sdk.services.offer.detail.config import OfferDetailConfigService
from mtop_sdk.services.offer.detail.miniod import OfferMiniodService
from mtop_sdk.transport import MtopTransport


class OfferDetailService:
    """商品详情相关接口集合。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._miniod = OfferMiniodService(transport)
        self._config = OfferDetailConfigService(transport)

    def get(self, offer_id: int) -> MtopResponse[OfferDetailData]:
        """获取商品完整详情。"""
        return self._miniod.get(offer_id)

    def get_config(self, ab_test_key: str) -> MtopResponse[JsonValue]:
        """获取详情页 AB 配置。"""
        return self._config.get(ab_test_key)
