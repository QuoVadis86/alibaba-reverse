"""`mtop.alisite.cbu.winport.sync` API 命名空间。"""

from api.transport import MtopTransport
from services.alisite.cbu.winport.sync.moduledata import ModuleDataService


class SyncServices:
    """店铺同步模块接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.moduledata = ModuleDataService(transport)
