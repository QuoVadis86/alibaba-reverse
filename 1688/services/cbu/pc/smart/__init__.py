"""`mtop.cbu.pc.smart` API 命名空间。"""

from api.transport import MtopTransport
from services.cbu.pc.smart.engine import EngineServices


class SmartServices:
    """PC 智能引擎接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.engine = EngineServices(transport)
