"""关键词、以图搜图和搜索推荐接口。"""

from typing import final

import requests

from api.transport import MtopTransport
from services._endpoint import EndpointGroup
from services.search.categories import RAW_ENDPOINTS as CATEGORY_ENDPOINTS
from services.search.image import RAW_ENDPOINTS as IMAGE_ENDPOINTS
from services.search.results import WirelessRecommendService
from services.search.suggest import RAW_ENDPOINTS as SUGGEST_ENDPOINTS


@final
class SearchServices:
    """搜索域客户端入口。"""

    def __init__(self, transport: MtopTransport, http: requests.Session) -> None:
        self.results = WirelessRecommendService(transport, http)
        self.suggest = EndpointGroup(transport, SUGGEST_ENDPOINTS)
        self.image = EndpointGroup(transport, IMAGE_ENDPOINTS)
        self.categories = EndpointGroup(transport, CATEGORY_ENDPOINTS)
