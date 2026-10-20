"""`mtop.alibaba.alisite.cbu.server.moduleasyncservice` 店铺模块接口。"""

import json
from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.shop import ShopMemberQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

API: Final = "mtop.alibaba.alisite.cbu.server.moduleasyncservice"


class ModuleAsyncService:
    """查询店铺头部和认证模块。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_header(self, query: ShopMemberQuery) -> MtopResponse[JsonValue]:
        """查询店铺公共头部模块。"""
        return self._get_module("wp_pc_common_header", query.member_id)

    def get_certification(self, query: ShopMemberQuery) -> MtopResponse[JsonValue]:
        """查询店铺认证模块。"""
        return self._get_module("wp_pc_certification", query.member_id)

    def _get_module(self, component_key: str, member_id: str) -> MtopResponse[JsonValue]:
        """调用异步模块接口读取指定组件。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "componentKey": component_key,
                    "params": json.dumps({"memberId": member_id}, separators=(",", ":")),
                },
            )
        )
