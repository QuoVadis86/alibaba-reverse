"""店铺卡片和页面组件服务。"""

from typing import final

from api.transport import MtopTransport
from services.shop.card import ShopCardService
from services.shop.modules import ModuleAsyncService
from services.shop.widgets import ModuleDataService


@final
class ShopServices:
    """店铺域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.card = ShopCardService(transport)
        self.modules = ModuleAsyncService(transport)
        self.widgets = ModuleDataService(transport)
