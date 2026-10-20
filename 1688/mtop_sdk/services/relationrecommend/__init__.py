"""relationrecommend API 命名空间。"""

import httpx2

from mtop_sdk.services.relationrecommend.wirelessrecommend import WirelessRecommendService
from mtop_sdk.transport import MtopTransport

class RelationRecommendServices:
    """`mtop.relationrecommend` 下的 API。"""

    def __init__(self, transport: MtopTransport, http: httpx2.Client) -> None:
        self.wirelessrecommend = WirelessRecommendService(transport, http)
