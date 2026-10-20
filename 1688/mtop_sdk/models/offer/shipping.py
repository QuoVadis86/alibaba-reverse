"""商品运费和履约接口入参。"""

from pydantic import BaseModel, ConfigDict, Field, PositiveInt


class FreightInfoQuery(BaseModel):
    """商品运费查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    to_address_code: str = Field(default="440300", min_length=1)
    scene: str = "dsc"
    amount: PositiveInt = 1


class FulfillmentQuery(BaseModel):
    """商品履约配送方案查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    amount: PositiveInt = 1
    address_code: str = Field(default="440300", min_length=1)
