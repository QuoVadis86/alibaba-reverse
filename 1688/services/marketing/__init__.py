"""`mtop.1688.marketing` 接口集合。"""

from api.transport import MtopTransport
from services.marketing.coupon import CouponService


class MarketingServices:
    """营销接口命名空间。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.coupon = CouponService(transport)
