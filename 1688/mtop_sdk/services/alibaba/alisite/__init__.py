"""`mtop.alibaba.alisite` API 命名空间。"""

from mtop_sdk.services.alibaba.alisite.cbu import CbuServices
from mtop_sdk.transport import MtopTransport


class AlisiteServices:
    """站点模块 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.cbu = CbuServices(transport)
