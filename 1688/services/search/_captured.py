"""搜索页 HAR 中的推荐接口请求格式。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.relationrecommend.WirelessRecommend.recommend"


class HotKeywordsQuery(BaseModel):
    """搜索框热词场景；rescnt 未指定时沿用首页请求格式。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    scene_source: str = Field(default="pccps", min_length=1)
    result_count: PositiveInt | None = None


class InputHotKeywordsQuery(BaseModel):
    """搜索框输入热词的数量。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    result_count: PositiveInt = 8


def hot_keywords(
    transport: MtopTransport, query: HotKeywordsQuery
) -> MtopResponse[JsonValue]:
    """按页面场景获取搜索框热词。"""
    params: JsonObject = {
        "bizName": "home_search",
        "verticalProductFlag": "pcmarket",
        "method": "shadeHotKeyword",
        "sceneSource": query.scene_source,
        "source": "pc_shade_hotword",
    }
    if query.result_count is not None:
        params["rescnt"] = query.result_count
    return call_captured(transport, 39799, params)


def input_hot_keywords(
    transport: MtopTransport, query: InputHotKeywordsQuery
) -> MtopResponse[JsonValue]:
    """获取搜索框输入时的热词。"""
    return call_captured(
        transport,
        39799,
        {
            "bizName": "input_hotKeyword",
            "verticalProductFlag": "pcmarket",
            "method": "inputHotKeyword",
            "rescnt": query.result_count,
        },
    )


def call_captured(
    transport: MtopTransport, app_id: int, params: JsonObject
) -> MtopResponse[JsonValue]:
    """按抓包中的 POST 请求格式调用推荐接口。"""
    return transport.request(
        MtopRequest(
            api=API,
            version="2.0",
            method="POST",
            data={
                "appId": app_id,
                "params": json.dumps(params, ensure_ascii=False, separators=(",", ":")),
            },
            extra_params={
                "type": "originaljson",
                "timeout": "20000",
                "callback": None,
            },
        )
    )
