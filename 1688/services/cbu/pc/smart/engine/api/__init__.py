"""`mtop.cbu.pc.smart.engine.api` API 命名空间。"""

from api.transport import MtopTransport
from services.cbu.pc.smart.engine.api.abtest import AbtestService


class EngineApiServices:
    """智能引擎公开 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.abtest = AbtestService(transport)
