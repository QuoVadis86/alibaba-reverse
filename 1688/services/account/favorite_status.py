"""通过 MTOP 查询商品收藏状态。"""

from typing import Final

from pydantic import PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "com.alibaba.china.buy.service.favorite.MtopFavoriteService.queryFavoriteStatus"


class FavoriteStatusService:
    """保留页面代码使用的 `com.alibaba...` MTOP API 名称。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: PositiveInt) -> MtopResponse[JsonValue]:
        """查询指定商品是否已收藏。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "contentId": offer_id,
                    "client": "pc",
                    "contentType": "OFFER_SALE",
                },
            )
        )
