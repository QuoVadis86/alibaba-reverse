"""`mtop.1688.trade.receiveaddress.queryReceiveAddresses` 接口。"""

from typing import Final

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.trade.receiveaddress.queryReceiveAddresses"


class ReceiveAddressService:
    """查询当前登录用户的收货地址。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def query_receive_addresses(self) -> MtopResponse[JsonValue]:
        """查询收货地址；未登录时返回 MTOP 会话过期状态。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={},
                extra_params={"type": "originaljson", "timeout": "20000", "callback": None},
            )
        )
