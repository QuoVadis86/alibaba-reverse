"""店铺接口入参。"""

from pydantic import BaseModel, ConfigDict, Field, PositiveInt


class ShopCardQuery(BaseModel):
    """店铺卡片所需的商品和卖家标识。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    seller_user_id: PositiveInt
    seller_member_id: str = Field(min_length=1)
    winport_url: str = ""
    top_category_id: PositiveInt = 15


class ShopMemberQuery(BaseModel):
    """店铺异步模块查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    member_id: str = Field(min_length=1)


class ShopRelationQuery(BaseModel):
    """检查当前会话与店铺的关注关系。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    shop_login_id: str = Field(min_length=1)
