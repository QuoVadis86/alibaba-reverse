"""`mtop.alibaba` API 命名空间。"""

from mtop_sdk.services.alibaba.alisite import AlisiteServices
from mtop_sdk.services.alibaba.carriagecenter import CarriageCenterServices
from mtop_sdk.transport import MtopTransport


class AlibabaServices:
    """`mtop.alibaba` 下的各业务 API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.alisite = AlisiteServices(transport)
        self.carriagecenter = CarriageCenterServices(transport)
