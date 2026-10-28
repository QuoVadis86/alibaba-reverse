"""`mtop.alisite.cbu` API 命名空间。"""

from api.transport import MtopTransport
from services.alisite.cbu.winport import WinportServices


class CbuServices:
    """店铺 CBU 接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.winport = WinportServices(transport)
