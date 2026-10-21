"""`mtop.alibaba` API 命名空间。"""

from services.alibaba.alisite import AlisiteServices
from services.alibaba.carriagecenter import CarriageCenterServices
from api.transport import MtopTransport


class AlibabaServices:
    """`mtop.alibaba` 下的各业务 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.alisite = AlisiteServices(transport)
        self.carriagecenter = CarriageCenterServices(transport)
