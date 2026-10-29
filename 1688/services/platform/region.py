"""`mtop.1688.IpRegionQueryService.queryIpInfo` 接口。"""

from typing import Final

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.IpRegionQueryService.queryIpInfo"


class IpRegionQueryService:
    """查询当前请求的 IP 地区信息。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def query_ip_info(self) -> MtopResponse[JsonValue]:
        """读取 IP 地区信息。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                data={},
                extra_params={
                    "_bx-login": "new",
                    "dataType": "json",
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )
