"""`mtop.cbu.pc.smart.engine.api.abtest.execute` 实验配置接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.cbu.pc.smart.engine.api.abtest.execute"


class AbtestQuery(BaseModel):
    """PC 智能引擎实验配置查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    abtest_code: str = Field(min_length=1)
    level1_biz: str = Field(min_length=1)
    level2_biz: str = Field(min_length=1)
    level3_biz: str = Field(min_length=1)


class AbtestService:
    """读取指定业务场景的实验配置。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def execute(self, query: AbtestQuery) -> MtopResponse[JsonValue]:
        """执行一次实验配置查询；业务失败时保留原始 MTOP 状态。"""
        extra_params = {
            "level1Biz": query.level1_biz,
            "level2Biz": query.level2_biz,
            "level3Biz": query.level3_biz,
        }
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "abtestCode": query.abtest_code,
                    "extraParams": json.dumps(extra_params, separators=(",", ":")),
                },
                extra_params={
                    "ignoreLogin": "true",
                    "prefix": "h5api",
                    "type": "originaljson",
                    "jsonpIncPrefix": "search1688",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )
