"""商品关键词搜索接口。"""

import json
from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.search import TextSearchQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

SEARCH_API: Final = "mtop.relationrecommend.WirelessRecommend.recommend"


class TextSearchService:
    """按关键词搜索商品。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: TextSearchQuery) -> MtopResponse[JsonValue]:
        """查询关键词对应的商品列表。"""
        params = {
            "method": "getOfferList",
            "beginPage": query.page,
            "pageSize": query.page_size,
            "keywords": query.keywords,
            "searchScene": "pcOfferSearch",
            "verticalProductFlag": "pcmarket",
            "charset": "GBK",
            "sortType": query.sort_type,
        }
        request = MtopRequest(
            api=SEARCH_API,
            version="2.0",
            method="POST",
            data={"appId": 32517, "params": json.dumps(params, separators=(",", ":"))},
        )
        return self._transport.request(request)
