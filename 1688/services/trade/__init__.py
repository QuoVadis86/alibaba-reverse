"""购物车、订单、地址与履约接口。"""

from typing import final

from api.transport import MtopTransport
from services._endpoint import EndpointGroup
from services.trade.address import ReceiveAddressService
from services.trade.analytics import RAW_ENDPOINTS as ANALYTICS_ENDPOINTS
from services.trade.cart import RAW_ENDPOINTS as CART_ENDPOINTS
from services.trade.fulfillment import FulfillmentSolutionService
from services.trade.order import RAW_ENDPOINTS as ORDER_ENDPOINTS


@final
class TradeServices:
    """交易域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.cart = EndpointGroup(transport, CART_ENDPOINTS)
        self.order = EndpointGroup(transport, ORDER_ENDPOINTS)
        self.analytics = EndpointGroup(transport, ANALYTICS_ENDPOINTS)
        self.address = ReceiveAddressService(transport)
        self.fulfillment = FulfillmentSolutionService(transport)
