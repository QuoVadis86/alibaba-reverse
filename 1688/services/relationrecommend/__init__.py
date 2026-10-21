"""relationrecommend API 命名空间。"""

import requests

from services.relationrecommend.wirelessrecommend import WirelessRecommendService
from api.transport import MtopTransport

class RelationRecommendServices:
    """`mtop.relationrecommend` 下的 API。"""

    def __init__(self, transport: MtopTransport, http: requests.Session) -> None:
        self.wirelessrecommend = WirelessRecommendService(transport, http)
