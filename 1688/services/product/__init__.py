"""商品信息、价格、评价和履约服务。"""

from typing import final

from api.transport import MtopTransport
from services.product.delivery import MtopRecommendService
from services.product.detail import MiniodService
from services.product.detail_extra import OfferDetailMtopService
from services.product.placement import PlacementDecisionService
from services.product.price import HandPriceService
from services.product.reviews import MtopRateService
from services.product.shipping import FreightInfoService
from services.product.sku import OfferSkuService


@final
class ProductServices:
    """商品域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.detail = MiniodService(transport)
        self.detail_extra = OfferDetailMtopService(transport)
        self.sku = OfferSkuService(transport)
        self.price = HandPriceService(transport)
        self.shipping = FreightInfoService(transport)
        self.reviews = MtopRateService(transport)
        self.placement = PlacementDecisionService(transport)
        self.delivery = MtopRecommendService(transport)
