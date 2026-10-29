"""账号、会员和收藏服务。"""

from typing import final

from api.transport import MtopTransport
from services.account.favorite import FavoriteService
from services.account.favorite_status import FavoriteStatusService
from services.account.member import FcaOneFassApiService
from services.account.user import UserSimpleService


@final
class AccountServices:
    """账号域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.user = UserSimpleService(transport)
        self.member = FcaOneFassApiService(transport)
        self.favorite = FavoriteService(transport)
        self.favorite_status = FavoriteStatusService(transport)
