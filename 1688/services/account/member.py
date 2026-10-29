"""`mtop.1688.fcaonefassapiservice.invoke` 会员信息接口。"""

from typing import Final

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.fcaonefassapiservice.invoke"


class FcaOneFassApiService:
    """调用详情页使用的会员基础信息 FC 服务。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_member_info(self) -> MtopResponse[JsonValue]:
        """按详情页固定的 FC group、name 和 serviceName 查询。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                data={
                    "fcGroup": "cbu-offer-47126",
                    "fcName": "light",
                    "serviceName": "com.alibaba.china.light.methods.base.BaseAccountFn",
                    "params": {"params": ""},
                },
            )
        )
