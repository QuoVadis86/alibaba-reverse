"""`mtop.1688.protect.MtopRecommendService.ptsRecommendForOfferV1` 接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.protect.MtopRecommendService.ptsRecommendForOfferV1"


class DeliveryRecommendQuery(BaseModel):
    """商品预计发货服务所需的商品、数量和地址。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    category_id: PositiveInt
    quantity: PositiveInt
    seller_login_id: str = Field(min_length=1)
    from_address_code: str = Field(min_length=1)
    to_address_code: str = Field(min_length=1)
    scene: str = Field(default="dsc", min_length=1)
    supply: str = "xh"


class MtopRecommendService:
    """查询详情页展示的预计发货或配送标签。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_delivery_info(self, query: DeliveryRecommendQuery) -> MtopResponse[JsonValue]:
        """发送页面使用的推荐服务请求。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "categoryId": query.category_id,
                    "quantity": query.quantity,
                    "sellerLoginId": query.seller_login_id,
                    "scene": query.scene,
                    "fromSource": "odld",
                    "supply": query.supply,
                    "fromAddressCode": query.from_address_code,
                    "toAddressCode": query.to_address_code.split("|", 1)[0],
                },
            )
        )
