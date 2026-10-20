"""`mtop.user` API 命名空间。"""

from mtop_sdk.services.user.usersimple import UserSimpleService
from mtop_sdk.transport import MtopTransport


class UserServices:
    """用户 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.usersimple = UserSimpleService(transport)
