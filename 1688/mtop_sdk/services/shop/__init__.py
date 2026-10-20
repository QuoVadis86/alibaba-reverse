"""店铺接口集合。"""

from mtop_sdk.services.shop.card import ShopCardService
from mtop_sdk.services.shop.certification import ShopCertificationService
from mtop_sdk.services.shop.header import ShopHeaderService
from mtop_sdk.services.shop.relation import ShopRelationService
from mtop_sdk.transport import MtopTransport


class ShopService:
    """按店铺卡片、资料和关系分组暴露接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.card = ShopCardService(transport)
        self.certification = ShopCertificationService(transport)
        self.header = ShopHeaderService(transport)
        self.relation = ShopRelationService(transport)
