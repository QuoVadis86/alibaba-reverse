"""`mtop.1688.moga.pc` 接口集合。"""

from services.moga.pc.shopcard import ShopCardService
from api.transport import MtopTransport


class MogaPcServices:
    """PC 店铺卡片接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.shopcard = ShopCardService(transport)
