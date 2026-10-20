"""`mtop.alibaba.carriagecenter` API 命名空间。"""

from mtop_sdk.services.alibaba.carriagecenter.fulfillmentsolution import FulfillmentSolutionService
from mtop_sdk.transport import MtopTransport


class CarriageCenterServices:
    """物流履约服务。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.fulfillmentsolution = FulfillmentSolutionService(transport)
