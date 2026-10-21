"""1688 交易域接口集合。"""

from services.trade.mtoprateservice import MtopRateService
from api.transport import MtopTransport


class TradeNamespace:
    """`mtop.1688.trade` 路径下的接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.mtoprateservice = MtopRateService(transport)
