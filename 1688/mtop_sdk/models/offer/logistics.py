"""商品物流时效接口的业务入参。"""

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from mtop_sdk.models.common import JsonValue


class OfferLogisticsQuery(BaseModel):
    """物流时效接口的业务入参，字段值来自详情请求上下文。"""

    model_config = ConfigDict(frozen=True, populate_by_name=True, extra="forbid")

    offer_id: PositiveInt = Field(alias="offerId")
    seller_id: PositiveInt = Field(alias="sellerId")
    to_address_code: str = Field(default="440300", alias="toAddressCode")
    from_address_id: str = Field(default="", alias="fromAddressId")
    protection_infos: list[JsonValue] = Field(default_factory=list, alias="protectionInfos")
    buyer_protection_model: list[JsonValue] = Field(
        default_factory=list, alias="buyerProtectionModel"
    )
    offer_delivery_time: int = Field(default=0, alias="offerDeliveryTime", ge=0)
