"""当前用户基本信息接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.transport import MtopRequest, MtopTransport

USER_SIMPLE_API: Final = "mtop.user.getUserSimple"


class UserSimpleService:
    """获取当前登录会话对应的用户基本信息。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self) -> MtopResponse[JsonValue]:
        """需要有效的登录会话；未登录时返回服务端错误响应。"""
        return self._transport.request(
            MtopRequest(api=USER_SIMPLE_API, version="1.0", data={})
        )
