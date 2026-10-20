"""`mtop.1688.trade.service` 接口集合。"""

from mtop_sdk.services.trade.service.mtoprateservice import MtopRateService
from mtop_sdk.transport import MtopTransport


class TradeServices:
    """交易服务端点下的 MTOP API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.mtoprateservice = MtopRateService(transport)
