"""`mtop.1688.handPriceService.calculatePrice` 订单价格计算接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.handPriceService.calculatePrice"


class PriceSkuItem(BaseModel):
    """一次价格计算中的 SKU、数量与定制服务。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    spec_id: str | int
    sku_id: str | int
    number: PositiveInt
    price: int | float = Field(ge=0)
    extra_trade_services: list[JsonObject] = Field(default_factory=list)


class PriceCalculationQuery(BaseModel):
    """详情页传给手价服务的商品、地址和运费上下文。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    seller_user_id: int = Field(ge=0)
    buyer_id: int = Field(ge=0)
    send_address_code: str = Field(min_length=1)
    receive_address_code: str = Field(min_length=1)
    seller_login_id: str = Field(min_length=1)
    sku_items: list[PriceSkuItem] = Field(min_length=1)
    free_end_amount: int = -1
    template_id: int | None = Field(default=None, gt=0)
    official_logistics: bool = False
    unit_weight: float = Field(default=0, ge=0)
    sku_weight: JsonObject = Field(default_factory=dict)
    business_type: str = "normal"
    channel_key: str = ""
    source: str = "pc"
    page_scene: str = "dsc"


class HandPriceService:
    """根据详情页选中的 SKU 与收货地址计算价格。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def calculate(self, query: PriceCalculationQuery) -> MtopResponse[JsonValue]:
        """提交 SKU 价格计算参数，保留服务端原始价格结果。"""
        amount = sum(item.number for item in query.sku_items)
        sku_cal_params = [
            {
                "specId": item.spec_id,
                "number": item.number,
                "price": item.price,
                "skuId": item.sku_id,
                "extraTradeServices": item.extra_trade_services,
            }
            for item in query.sku_items
        ]
        extend_map: JsonObject = {
            "officialLogistics": query.official_logistics,
            "unitWeight": query.unit_weight,
            "skuWeight": json.dumps(query.sku_weight, ensure_ascii=False, separators=(",", ":")),
            "sellerLoginId": query.seller_login_id,
            "amount": amount,
        }
        if query.template_id is not None:
            extend_map["templateId"] = query.template_id
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "sellerUserId": query.seller_user_id,
                    "buyerId": query.buyer_id,
                    "businessType": query.business_type,
                    "channelKey": query.channel_key,
                    "source": query.source,
                    "pageScene": query.page_scene,
                    "freeEndAmount": query.free_end_amount,
                    "receiveAddressCode": query.receive_address_code,
                    "sendAddressCode": query.send_address_code,
                    "skuCalParams": json.dumps(sku_cal_params, ensure_ascii=False, separators=(",", ":")),
                    "extendMap": json.dumps(extend_map, ensure_ascii=False, separators=(",", ":")),
                },
            )
        )
