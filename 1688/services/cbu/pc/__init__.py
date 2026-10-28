"""`mtop.cbu.pc` API 命名空间。"""

from api.transport import MtopTransport
from services.cbu.pc.smart import SmartServices


class PcServices:
    """PC 端业务接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.smart = SmartServices(transport)
