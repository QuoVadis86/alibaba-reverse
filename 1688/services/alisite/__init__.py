"""`mtop.alisite` API 命名空间。"""

from api.transport import MtopTransport
from services.alisite.cbu import CbuServices


class AlisiteServices:
    """1688 店铺站点接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.cbu = CbuServices(transport)
