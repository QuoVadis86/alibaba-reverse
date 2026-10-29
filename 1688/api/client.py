"""SDK 客户端入口。"""

from __future__ import annotations

from typing import final

import requests

from api.transport import MtopTransport
from services.account import AccountServices
from services.ai import AiServices
from services.home import HomeServices
from services.marketing import MarketingServices
from services.platform import PlatformServices
from services.product import ProductServices
from services.recommend import RecommendServices
from services.search import SearchServices
from services.shop import ShopServices
from services.trade import TradeServices


@final
class MtopClient:
    """1688 MTOP SDK；接口按业务域和能力分组。"""

    def __init__(
        self, http: requests.Session, cookie_string: str | None = None
    ) -> None:
        transport = MtopTransport(http, cookie_string)
        self.product = ProductServices(transport)
        self.shop = ShopServices(transport)
        self.account = AccountServices(transport)
        self.home = HomeServices(transport)
        self.search = SearchServices(transport, http)
        self.recommend = RecommendServices(transport)
        self.ai = AiServices(transport)
        self.trade = TradeServices(transport)
        self.marketing = MarketingServices(transport)
        self.platform = PlatformServices(transport)
        self.offer_detail = self.product.detail
