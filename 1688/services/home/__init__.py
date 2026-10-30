"""首页卡片、私域信息流和导航接口。"""

from typing import final

from api.transport import MtopTransport
from services.home.cards import HomeCardService
from services.home.feed import HomeFeedService
from services.home.navigation import HomeNavigationService


@final
class HomeServices:
    """首页域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.cards = HomeCardService(transport)
        self.feed = HomeFeedService(transport)
        self.navigation = HomeNavigationService(transport)
