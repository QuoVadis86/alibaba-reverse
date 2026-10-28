"""`mtop.cbu` API 命名空间。"""

from api.transport import MtopTransport
from services.cbu.pc import PcServices


class CbuServices:
    """CBU 业务接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.pc = PcServices(transport)
