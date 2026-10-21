"""1688 WOSC 接口集合。"""

from services.wosc.queryofferskuselectormodel import OfferSkuService
from api.transport import MtopTransport


class WoscServices:
    """`mtop.1688.wosc` 下的 MTOP API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.queryofferskuselectormodel = OfferSkuService(transport)
