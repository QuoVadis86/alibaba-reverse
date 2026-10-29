"""推荐池和推荐信息流接口。"""

from typing import final

from api.transport import MtopTransport
from services._endpoint import EndpointGroup
from services.recommend.feeds import RAW_ENDPOINTS as FEED_ENDPOINTS
from services.recommend.pools import RAW_ENDPOINTS as POOL_ENDPOINTS


@final
class RecommendServices:
    """推荐域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.feeds = EndpointGroup(transport, FEED_ENDPOINTS)
        self.pools = EndpointGroup(transport, POOL_ENDPOINTS)
