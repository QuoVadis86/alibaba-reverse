"""`mtop.alibaba.alisite.cbu` API 命名空间。"""

from mtop_sdk.services.alibaba.alisite.cbu.server import ServerServices
from mtop_sdk.transport import MtopTransport


class CbuServices:
    """CBU 站点服务。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.server = ServerServices(transport)
