"""`mtop.user.getUserSimple` 当前用户信息接口。"""

from typing import Final

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.user.getUserSimple"


class UserSimpleService:
    """读取当前登录会话对应的用户基本信息。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self) -> MtopResponse[JsonValue]:
        """获取当前登录用户的基本资料；调用需要有效的登录会话。"""
        return self._transport.request(MtopRequest(api=API, version="1.0", data={}))
