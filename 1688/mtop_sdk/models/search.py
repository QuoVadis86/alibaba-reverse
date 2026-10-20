"""商品搜索接口入参。"""

from pydantic import BaseModel, ConfigDict, Field, PositiveInt


class TextSearchQuery(BaseModel):
    """商品关键词搜索条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    keywords: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 60
    sort_type: str = "normal"


class SearchConfigQuery(BaseModel):
    """搜索页筛选和类目配置查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    keywords: str = Field(min_length=1)


class ImageSearchQuery(BaseModel):
    """基于远程图片地址的相似商品搜索条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    image_address: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 60


class ImageIdSearchQuery(BaseModel):
    """基于已上传图片 ID 的商品搜索条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    image_id: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 60
