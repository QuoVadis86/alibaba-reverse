"""relationrecommend API 命名空间。"""

import requests

from mtop_sdk.services.relationrecommend.wirelessrecommend import WirelessRecommendService
from mtop_sdk.transport import MtopTransport

class RelationRecommendServices:
    """`mtop.relationrecommend` 下的 API。"""

    def __init__(self, transport: MtopTransport, http: requests.Session) -> None:
        self.wirelessrecommend = WirelessRecommendService(transport, http)
