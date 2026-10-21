"""`mtop.user` API 命名空间。"""

from services.user.usersimple import UserSimpleService
from api.transport import MtopTransport


class UserServices:
    """用户 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.usersimple = UserSimpleService(transport)
