"""首页卡片、私域信息流和导航接口。"""

from typing import final

from api.transport import MtopTransport
from services._endpoint import EndpointGroup
from services.home.cards import RAW_ENDPOINTS as CARD_ENDPOINTS
from services.home.feed import RAW_ENDPOINTS as FEED_ENDPOINTS
from services.home.navigation import RAW_ENDPOINTS as NAVIGATION_ENDPOINTS


@final
class HomeServices:
    """首页域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.cards = EndpointGroup(transport, CARD_ENDPOINTS)
        self.feed = EndpointGroup(transport, FEED_ENDPOINTS)
        self.navigation = EndpointGroup(transport, NAVIGATION_ENDPOINTS)
