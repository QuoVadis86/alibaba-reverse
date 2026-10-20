"""商品详情 MTOP miniod 接口的稳定响应字段。"""

from pydantic import BaseModel, ConfigDict, Field

from mtop_sdk.models.common import JsonObject, JsonValue


class OfferDetailData(BaseModel):
    """详情接口整理后的数据；动态商品字段保留为 JSON 对象。"""

    model_config = ConfigDict(frozen=True, populate_by_name=True, extra="forbid")

    offer_detail: JsonObject = Field(alias="offerDetail")
    data_model: JsonObject = Field(default_factory=dict, alias="dataModel")
    endpoint: JsonValue | None = None
    hierarchy: JsonValue | None = None
