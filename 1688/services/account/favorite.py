"""商品收藏与取消收藏的两个 MTOP 接口。"""

import json
import time
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

ADD_API: Final = "mtop.1688.buyertoos.favorite.addoffer"
DELETE_API: Final = "mtop.1688.buyertoos.favorite.deleteoffer"


class FavoriteOfferQuery(BaseModel):
    """待收藏或取消收藏的商品及可选请求时间戳。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    request_timestamp_ms: int | None = Field(default=None, ge=0)


class FavoriteService:
    """收藏商品或取消收藏。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def add_offer(self, query: FavoriteOfferQuery) -> MtopResponse[JsonValue]:
        """收藏指定商品。"""
        timestamp = (
            query.request_timestamp_ms
            if query.request_timestamp_ms is not None
            else time.time_ns() // 1_000_000
        )
        return self._transport.request(
            MtopRequest(
                api=ADD_API,
                version="1.0",
                method="POST",
                data={"ac": timestamp, "offerId": query.offer_id},
            )
        )

    def delete_offer(self, query: FavoriteOfferQuery) -> MtopResponse[JsonValue]:
        """取消收藏指定商品。"""
        timestamp = (
            query.request_timestamp_ms
            if query.request_timestamp_ms is not None
            else time.time_ns() // 1_000_000
        )
        return self._transport.request(
            MtopRequest(
                api=DELETE_API,
                version="1.0",
                method="POST",
                data={
                    "ac": timestamp,
                    "offerIds": json.dumps([query.offer_id], separators=(",", ":")),
                },
            )
        )
