"""用户接口集合。"""

from mtop_sdk.services.user.simple import UserSimpleService
from mtop_sdk.transport import MtopTransport


class UserService:
    """当前登录会话的用户信息接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.simple = UserSimpleService(transport)
