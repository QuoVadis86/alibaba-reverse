"""商品评价接口集合。"""

from mtop_sdk.services.reviews.dsr import OfferDsrService
from mtop_sdk.services.reviews.list import OfferRatingsService
from mtop_sdk.transport import MtopTransport


class ReviewsService:
    """商品评价列表和 DSR 评分接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.list = OfferRatingsService(transport)
        self.dsr = OfferDsrService(transport)
