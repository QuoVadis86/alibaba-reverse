"""`mtop.alibaba.alisite.cbu.server` API 命名空间。"""

from services.alibaba.alisite.cbu.server.moduleasyncservice import ModuleAsyncService
from api.transport import MtopTransport


class ServerServices:
    """CBU 服务端 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.moduleasyncservice = ModuleAsyncService(transport)
