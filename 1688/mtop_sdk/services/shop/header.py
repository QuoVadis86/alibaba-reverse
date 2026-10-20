"""店铺异步头部模块接口。"""

import json
from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.shop import ShopMemberQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

SHOP_MODULE_API: Final = "mtop.alibaba.alisite.cbu.server.moduleasyncservice"


class ShopHeaderService:
    """查询店铺公共头部信息。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: ShopMemberQuery) -> MtopResponse[JsonValue]:
        """根据 memberId 查询店铺头部模块。"""
        request = MtopRequest(
            api=SHOP_MODULE_API,
            version="1.0",
            method="POST",
            data={
                "componentKey": "wp_pc_common_header",
                "params": json.dumps({"memberId": query.member_id}, separators=(",", ":")),
            },
        )
        return self._transport.request(request)
