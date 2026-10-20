"""SDK 客户端入口。"""

from __future__ import annotations

import httpx2

from mtop_sdk.services.alibaba import AlibabaServices
from mtop_sdk.services.freightinfoservice import FreightInfoService
from mtop_sdk.services.laputa import LaputaServices
from mtop_sdk.services.mmga import MmgaServices
from mtop_sdk.services.moga import MogaServices
from mtop_sdk.services.relationrecommend import RelationRecommendServices
from mtop_sdk.services.trade import TradeNamespace
from mtop_sdk.services.user import UserServices
from mtop_sdk.transport import MtopTransport
from mtop_sdk.services.wosc import WoscServices


class MtopClient:
    """1688 MTOP SDK；接口入口遵循 MTOP API 路径命名。"""

    def __init__(self, http: httpx2.Client, cookie_string: str | None = None) -> None:
        transport = MtopTransport(http, cookie_string)
        self.mmga = MmgaServices(transport)
        self.laputa = LaputaServices(transport)
        self.wosc = WoscServices(transport)
        self.moga = MogaServices(transport)
        self.trade = TradeNamespace(transport)
        self.freightinfoservice = FreightInfoService(transport)
        self.alibaba = AlibabaServices(transport)
        self.relationrecommend = RelationRecommendServices(transport, http)
        self.user = UserServices(transport)
