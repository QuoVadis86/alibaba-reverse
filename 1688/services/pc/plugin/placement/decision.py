"""`mtop.1688.pc.plugin.placement.decision.batchget` 接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.pc.plugin.placement.decision.batchget"


class PlacementQuery(BaseModel):
    """批量查询页面插件位点的条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    positions: list[str] = Field(min_length=1)
    language: str = Field(default="zh", min_length=1)


class PlacementDecisionService:
    """按位点获取 PC 页面插件配置。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def batchget(self, query: PlacementQuery) -> MtopResponse[JsonValue]:
        """批量查询位点配置。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "positionList": json.dumps(query.positions, ensure_ascii=False, separators=(",", ":")),
                    "language": query.language,
                },
                extra_params={
                    "_bx-login": "new",
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )
