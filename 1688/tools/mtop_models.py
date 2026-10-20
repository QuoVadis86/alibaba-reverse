"""1688 接口的业务入参和统一响应模型。"""

from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field

type JsonValue = (
    str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]
)
type JsonObject = dict[str, JsonValue]


class OfferLogisticsQuery(BaseModel):
    """物流时效接口的业务入参。字段值应来自商品详情请求上下文。"""

    model_config = ConfigDict(frozen=True, populate_by_name=True, extra="forbid")

    offer_id: str = Field(alias="offerId", min_length=1)
    to_address_code: str = Field(alias="toAddressCode", min_length=1)
    from_address_id: str = Field(alias="fromAddressId", min_length=1)
    seller_id: str = Field(alias="sellerId", min_length=1)
    protection_infos: JsonValue = Field(alias="protectionInfos")
    buyer_protection_model: JsonValue = Field(alias="buyerProtectionModel")
    offer_delivery_time: JsonValue = Field(alias="offerDeliveryTime")


@dataclass(frozen=True, slots=True)
class MtopResponse:
    """统一的 MTOP 响应；业务数据放在 data，原始响应保留在 raw。"""

    ret: tuple[str, ...]
    data: JsonValue | None
    raw: JsonObject

    @property
    def success(self) -> bool:
        """根据 MTOP ret 状态判断请求是否成功。"""
        return any(code == "SUCCESS" or code.startswith("SUCCESS::") for code in self.ret)

    def to_dict(self) -> JsonObject:
        """返回适合 JSON 输出的统一结构。"""
        return {"success": self.success, "ret": list(self.ret), "data": self.data}
