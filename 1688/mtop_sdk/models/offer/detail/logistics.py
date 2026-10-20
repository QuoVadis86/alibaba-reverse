"""商品物流时效接口入参。"""

from pydantic import BaseModel, ConfigDict, Field

from mtop_sdk.models.common import JsonValue


class OfferLogisticsQuery(BaseModel):
    """物流时效接口的业务入参，字段值来自详情请求上下文。"""

    model_config = ConfigDict(frozen=True, populate_by_name=True, extra="forbid")

    offer_id: str = Field(alias="offerId", min_length=1)
    to_address_code: str = Field(alias="toAddressCode", min_length=1)
    from_address_id: str = Field(alias="fromAddressId", min_length=1)
    seller_id: str = Field(alias="sellerId", min_length=1)
    protection_infos: JsonValue = Field(alias="protectionInfos")
    buyer_protection_model: JsonValue = Field(alias="buyerProtectionModel")
    offer_delivery_time: JsonValue = Field(alias="offerDeliveryTime")
