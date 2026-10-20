"""当前会话与店铺关注关系接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.shop import ShopRelationQuery
from mtop_sdk.services.offer.detail.common import DETAIL_API, DETAIL_HEADERS
from mtop_sdk.transport import MtopRequest, MtopTransport

SHOP_RELATION_API: Final = DETAIL_API


class ShopRelationService:
    """查询当前用户是否关注指定店铺。需要有效登录会话。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: ShopRelationQuery) -> MtopResponse[JsonValue]:
        """查询当前会话与店铺的关注关系。"""
        request = MtopRequest(
            api=SHOP_RELATION_API,
            version="1.0",
            method="POST",
            data={
                "mmgaRequest": {
                    "serviceName": "shopRelationFnService",
                    "shopLoginId": query.shop_login_id,
                }
            },
            headers=DETAIL_HEADERS,
        )
        return self._transport.request(request)
