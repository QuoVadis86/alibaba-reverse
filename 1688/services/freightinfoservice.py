"""`mtop.1688.freightInfoService` 运费接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.freightInfoService.getFreightInfoWithScene"


class FreightInfoQuery(BaseModel):
    """商品运费查询条件，字段对应 getFreightInfoWithScene 请求体。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: int = Field(default=0, ge=0)
    seller_user_id: int = Field(default=0, ge=0)
    send_address_code: str = Field(min_length=1)
    receive_address_code: str = Field(default="440300", min_length=1)
    sku_id: str = Field(min_length=1)
    sku_weight: int | float = Field(gt=0)
    seller_login_id: str = Field(min_length=1)
    template_id: PositiveInt
    amount: PositiveInt = 1
    free_end_amount: int = -1
    page_scene: str = "dsc"
    official_logistics: bool = False
    unit_weight: float = 0


class FreightInfoService:
    """查询指定收货地区和购买数量对应的商品运费。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: FreightInfoQuery) -> MtopResponse[JsonValue]:
        """根据 SKU、发货地和收货地查询运费。"""
        sku_cal_params = json.dumps(
            [{"skuId": query.sku_id, "number": query.amount}],
            ensure_ascii=False,
            separators=(",", ":"),
        )
        extend_map = json.dumps(
            {
                "officialLogistics": query.official_logistics,
                "unitWeight": query.unit_weight,
                "skuWeight": json.dumps(
                    {query.sku_id: query.sku_weight},
                    ensure_ascii=False,
                    separators=(",", ":"),
                ),
                "sellerLoginId": query.seller_login_id,
                "templateId": query.template_id,
                "amount": query.amount,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "sellerUserId": query.seller_user_id,
                    "sendAddressCode": query.send_address_code,
                    "receiveAddressCode": query.receive_address_code,
                    "freeEndAmount": query.free_end_amount,
                    "pageScene": query.page_scene,
                    "skuCalParams": sku_cal_params,
                    "extendMap": extend_map,
                },
                extra_params={
                    "jsv": None,
                    "api": None,
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
                include_data_in_query=True,
            )
        )
