"""`mtop.alibaba.alisite` API 命名空间。"""

from services.alibaba.alisite.cbu import CbuServices
from api.transport import MtopTransport


class AlisiteServices:
    """站点模块 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.cbu = CbuServices(transport)
