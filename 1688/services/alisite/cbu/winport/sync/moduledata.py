"""`mtop.alisite.cbu.winport.sync.moduledata.get` 店铺组件接口。"""

import json
from dataclasses import dataclass
from typing import Final, Literal

from pydantic import BaseModel, ConfigDict, Field

from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.alisite.cbu.winport.sync.moduledata.get"


class WinportMemberQuery(BaseModel):
    """店铺页面模块的会员标识。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    member_id: str = Field(min_length=1)


@dataclass(frozen=True, slots=True)
class ModuleCall:
    """一次店铺同步组件请求的协议配置。"""

    component_key: str
    params: JsonObject
    method: Literal["GET", "POST"]
    data_type: Literal["json", "jsonp"]
    force_ignore_cache: bool = False


class ModuleDataService:
    """获取店铺头部、折扣和优惠券模块。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_header(self, query: WinportMemberQuery) -> MtopResponse[JsonValue]:
        """获取店铺公共头部。"""
        return self._request(
            ModuleCall("wp_pc_common_header", {"memberId": query.member_id}, "POST", "jsonp")
        )

    def get_discount_information(
        self, query: WinportMemberQuery
    ) -> MtopResponse[JsonValue]:
        """获取店铺折扣信息。"""
        return self._request(
            ModuleCall(
                "wp_store_discount_information",
                {"memberId": query.member_id, "appdata": {"source": "winport"}},
                "GET",
                "json",
            )
        )

    def get_coupon_banner(self, query: WinportMemberQuery) -> MtopResponse[JsonValue]:
        """获取店铺优惠券横幅。"""
        return self._request(
            ModuleCall(
                "wp_store_coupon_banner",
                {"memberId": query.member_id},
                "POST",
                "json",
                force_ignore_cache=True,
            )
        )

    def _request(self, call: ModuleCall) -> MtopResponse[JsonValue]:
        """按组件类型组装同步模块请求。"""
        extra_params = {
            "jsv": "2.7.5",
            "type": "json",
            "valueType": "string",
            "dataType": call.data_type,
            "timeout": "10000",
            "callback": None,
        }
        if call.force_ignore_cache:
            extra_params["forceIgnoreFSCache"] = "true"
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method=call.method,
                data={
                    "componentKey": call.component_key,
                    "params": json.dumps(call.params, ensure_ascii=False, separators=(",", ":")),
                },
                extra_params=extra_params,
            )
        )
