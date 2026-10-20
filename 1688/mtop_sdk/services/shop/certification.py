"""店铺认证信息接口。"""

import json
from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.shop import ShopMemberQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

SHOP_MODULE_API: Final = "mtop.alibaba.alisite.cbu.server.moduleasyncservice"


class ShopCertificationService:
    """查询店铺认证模块。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: ShopMemberQuery) -> MtopResponse[JsonValue]:
        """根据 memberId 查询店铺认证信息。"""
        request = MtopRequest(
            api=SHOP_MODULE_API,
            version="1.0",
            method="POST",
            data={
                "componentKey": "wp_pc_certification",
                "params": json.dumps({"memberId": query.member_id}, separators=(",", ":")),
            },
        )
        return self._transport.request(request)
