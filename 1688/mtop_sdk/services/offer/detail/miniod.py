"""完整商品详情 MTOP miniod 接口。"""

from __future__ import annotations

import json
from typing import assert_never

from mtop_sdk.exceptions import MtopError
from mtop_sdk.models.common import JsonObject, JsonValue, MtopResponse
from mtop_sdk.models.offer.detail.miniod import OfferDetailData
from mtop_sdk.transport import MtopRequest, MtopTransport

DETAIL_API = "mtop.1688.laputa.miniod"


class OfferMiniodService:
    """查询商品基础详情、价格、图片和详情页数据模型。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: int) -> MtopResponse[OfferDetailData]:
        """请求商品详情并解析稳定的外层 model 结构。"""
        request = MtopRequest(
            api=DETAIL_API,
            version="1.0",
            method="POST",
            data={
                "sk": "",
                "offerId": offer_id,
                "parametersMap": json.dumps(
                    {"fromPC": True},
                    separators=(",", ":"),
                ),
            },
        )
        response = self._transport.request(request)
        if not response.success:
            return MtopResponse[OfferDetailData](
                ret=response.ret,
                data=None,
                raw=response.raw,
            )

        payload = _require_object(response.data, "data")
        model_data = _require_object(payload.get("model"), "model")
        offer_model = _require_object(model_data.get("offerModel"), "offerModel")
        offer_detail = _require_object(offer_model.get("offerDetail"), "offerDetail")
        data_model = _require_object(model_data.get("dataModel", {}), "dataModel")
        parsed_data = OfferDetailData.model_validate(
            {
                "offerDetail": offer_detail,
                "dataModel": data_model,
                "endpoint": model_data.get("endpoint"),
                "hierarchy": model_data.get("hierarchy"),
            }
        )

        return MtopResponse[OfferDetailData](
            ret=response.ret,
            data=parsed_data,
            raw=response.raw,
        )


def _require_object(value: JsonValue | None, field_name: str) -> JsonObject:
    """从动态响应中读取必需 JSON 对象，并在结构异常时给出接口错误。"""
    match value:
        case dict(result):
            return result
        case str() | int() | float() | bool() | list() | None:
            raise MtopError(f"商品详情响应中的 {field_name} 不是对象")
        case unreachable:
            assert_never(unreachable)
