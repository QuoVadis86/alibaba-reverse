"""商品搜索接口集合。"""

import httpx2

from mtop_sdk.services.search.config import SearchConfigService
from mtop_sdk.services.search.image import ImageSearchService
from mtop_sdk.services.search.text import TextSearchService
from mtop_sdk.transport import MtopTransport


class SearchService:
    """关键词、搜索配置和以图搜图接口。"""

    def __init__(self, transport: MtopTransport, http: httpx2.Client) -> None:
        self.text = TextSearchService(transport)
        self.config = SearchConfigService(transport)
        self.image = ImageSearchService(transport, http)
