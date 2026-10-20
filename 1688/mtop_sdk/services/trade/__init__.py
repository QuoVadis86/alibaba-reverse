"""1688 交易域接口集合。"""

from mtop_sdk.services.trade.service import TradeServices
from mtop_sdk.transport import MtopTransport


class TradeNamespace:
    """`mtop.1688.trade` 路径下的服务命名空间。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.service = TradeServices(transport)
