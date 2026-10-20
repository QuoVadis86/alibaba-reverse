"""`mtop.1688.laputa.miniod` 商品详情接口。"""

from __future__ import annotations

import json
from typing import assert_never

from mtop_sdk.exceptions import MtopError
from mtop_sdk.models.common import JsonObject, JsonValue, MtopResponse
from mtop_sdk.models.offer.detail.miniod import OfferDetailData
from mtop_sdk.transport import MtopRequest, MtopTransport

API = "mtop.1688.laputa.miniod"


class MiniodService:
    """查询商品详情并解析稳定的响应外层结构。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: int) -> MtopResponse[OfferDetailData]:
        """读取商品详情、页面数据模型和页面层级信息。"""
        response = self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "sk": "",
                    "offerId": offer_id,
                    "parametersMap": json.dumps({"fromPC": True}, separators=(",", ":")),
                },
            )
        )
        if not response.success:
            return MtopResponse[OfferDetailData](
                ret=response.ret,
                data=None,
                raw=response.raw,
            )

        payload = _require_object(response.data, "data")
        model = _require_object(payload.get("model"), "model")
        offer_model = _require_object(model.get("offerModel"), "offerModel")
        offer_detail = _require_object(offer_model.get("offerDetail"), "offerDetail")
        data_model = _require_object(model.get("dataModel", {}), "dataModel")
        parsed = OfferDetailData.model_validate(
            {
                "offerDetail": offer_detail,
                "dataModel": data_model,
                "endpoint": model.get("endpoint"),
                "hierarchy": model.get("hierarchy"),
            }
        )
        return MtopResponse[OfferDetailData](ret=response.ret, data=parsed, raw=response.raw)


def _require_object(value: JsonValue | None, field_name: str) -> JsonObject:
    """从动态响应中读取对象节点。"""
    match value:
        case dict(result):
            return result
        case str() | int() | float() | bool() | list() | None:
            raise MtopError(f"商品详情响应中的 {field_name} 不是对象")
        case unreachable:
            assert_never(unreachable)
