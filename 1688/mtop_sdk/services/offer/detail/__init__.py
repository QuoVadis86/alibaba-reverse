"""商品详情相关接口集合。"""

from __future__ import annotations

from mtop_sdk.models.common import MtopResponse
from mtop_sdk.models.offer.detail.logistics import OfferLogisticsQuery
from mtop_sdk.services.offer.detail.config import OfferDetailConfigService
from mtop_sdk.services.offer.detail.logistics import OfferLogisticsService
from mtop_sdk.transport import MtopTransport


class OfferDetailService:
    """详情服务门面，内部按单个接口分别实现。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._config = OfferDetailConfigService(transport)
        self._logistics = OfferLogisticsService(transport)

    def get_config(self, ab_test_key: str) -> MtopResponse:
        """获取详情页 AB 配置。"""
        return self._config.get(ab_test_key)

    def get_logistics(self, query: OfferLogisticsQuery) -> MtopResponse:
        """查询商品物流时效。"""
        return self._logistics.get(query)
