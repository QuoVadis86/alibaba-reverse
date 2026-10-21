"""1688 Laputa 接口集合。"""

from services.laputa.miniod import MiniodService
from api.transport import MtopTransport


class LaputaServices:
    """`mtop.1688.laputa` 下的 MTOP API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.miniod = MiniodService(transport)
