"""商品评价接口入参。"""

from pydantic import BaseModel, ConfigDict, Field, PositiveInt


class OfferRatingsQuery(BaseModel):
    """商品评价列表分页条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    page: PositiveInt = 1
    page_size: PositiveInt = 20
    star_level: str = "all"


class OfferDsrQuery(BaseModel):
    """商品 DSR 评分查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    scene: str = "dsc"
