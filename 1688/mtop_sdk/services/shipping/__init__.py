"""商品运费和履约配送接口集合。"""

from mtop_sdk.services.shipping.freight import FreightInfoService
from mtop_sdk.services.shipping.fulfillment import FulfillmentService
from mtop_sdk.transport import MtopTransport


class ShippingService:
    """运费估算和履约方案接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.freight = FreightInfoService(transport)
        self.fulfillment = FulfillmentService(transport)
