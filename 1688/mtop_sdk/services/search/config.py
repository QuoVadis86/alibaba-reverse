"""商品搜索筛选配置接口。"""

import json
from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.search import SearchConfigQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

SEARCH_API: Final = "mtop.relationrecommend.WirelessRecommend.recommend"


class SearchConfigService:
    """查询搜索页类目导航和筛选项。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: SearchConfigQuery) -> MtopResponse[JsonValue]:
        """根据关键词获取搜索配置。"""
        params = {
            "method": "batchGetNavigationAndConfigData",
            "keywords": query.keywords,
            "searchScene": "pcOfferSearch",
            "verticalProductFlag": "pcmarket",
            "charset": "GBK",
        }
        request = MtopRequest(
            api=SEARCH_API,
            version="2.0",
            method="POST",
            data={"appId": 32517, "params": json.dumps(params, separators=(",", ":"))},
        )
        return self._transport.request(request)
