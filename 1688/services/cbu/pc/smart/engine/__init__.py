"""`mtop.cbu.pc.smart.engine` API 命名空间。"""

from api.transport import MtopTransport
from services.cbu.pc.smart.engine.api import EngineApiServices


class EngineServices:
    """智能引擎服务集合。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.api = EngineApiServices(transport)
