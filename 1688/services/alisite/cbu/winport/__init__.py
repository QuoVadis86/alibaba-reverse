"""`mtop.alisite.cbu.winport` API 命名空间。"""

from api.transport import MtopTransport
from services.alisite.cbu.winport.sync import SyncServices


class WinportServices:
    """店铺页面接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.sync = SyncServices(transport)
