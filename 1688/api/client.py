"""SDK 客户端入口。"""

from __future__ import annotations

import requests

from services.alibaba import AlibabaServices
from services.alisite import AlisiteServices
from services.cbu import CbuServices
from services.freightinfoservice import FreightInfoService
from services.ipregionqueryservice import IpRegionQueryService
from services.laputa import LaputaServices
from services.mmga import MmgaServices
from services.moga import MogaServices
from services.pc import PcServices
from services.relationrecommend import RelationRecommendServices
from services.trade import TradeNamespace
from services.user import UserServices
from api.transport import MtopTransport
from services.wosc import WoscServices


class MtopClient:
    """1688 MTOP SDK；接口入口遵循 MTOP API 路径命名。"""

    def __init__(self, http: requests.Session, cookie_string: str | None = None) -> None:
        transport = MtopTransport(http, cookie_string)
        self.mmga = MmgaServices(transport)
        self.laputa = LaputaServices(transport)
        # 提供按业务含义调用商品详情的入口；laputa.miniod 保留 MTOP 路径命名。
        self.offer_detail = self.laputa.miniod
        self.wosc = WoscServices(transport)
        self.moga = MogaServices(transport)
        self.pc = PcServices(transport)
        self.trade = TradeNamespace(transport)
        self.freightinfoservice = FreightInfoService(transport)
        self.ipregionqueryservice = IpRegionQueryService(transport)
        self.alibaba = AlibabaServices(transport)
        self.alisite = AlisiteServices(transport)
        self.cbu = CbuServices(transport)
        self.relationrecommend = RelationRecommendServices(transport, http)
        self.user = UserServices(transport)
