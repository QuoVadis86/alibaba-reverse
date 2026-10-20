"""SDK 客户端入口。"""

from __future__ import annotations

import httpx2

from mtop_sdk.services.offer import OfferService
from mtop_sdk.services.reviews import ReviewsService
from mtop_sdk.services.search import SearchService
from mtop_sdk.services.shipping import ShippingService
from mtop_sdk.services.shop import ShopService
from mtop_sdk.transport import MtopTransport
from mtop_sdk.services.user import UserService


class MtopClient:
    """1688 MTOP SDK；不同业务接口按服务分组挂载。"""

    def __init__(self, http: httpx2.Client, cookie_string: str | None = None) -> None:
        transport = MtopTransport(http, cookie_string)
        self.offer = OfferService(transport)
        self.reviews = ReviewsService(transport)
        self.search = SearchService(transport, http)
        self.shipping = ShippingService(transport)
        self.shop = ShopService(transport)
        self.user = UserService(transport)
