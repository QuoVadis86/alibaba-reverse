"""`mtop.1688.trade.service.MtopRateService` 的评价和 DSR 方法。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

RATINGS_API: Final = "mtop.1688.trade.service.MtopRateService.queryItemRatedListV2"
DSR_API: Final = "mtop.1688.trade.service.MtopRateService.queryDsrRateDataV2"


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


class DetailRatingsQuery(BaseModel):
    """商品详情页评价列表查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    item_id: PositiveInt
    login_id: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 2
    order_field_for_mtop: int = 2
    scene: str = "item"
    site: str | None = None
    tag_name: str = "全部"
    tag_type: str = "common"


class DetailDsrQuery(BaseModel):
    """商品详情页 DSR 评分查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    login_id: str = Field(min_length=1)
    scene: str = "item"
    site: str | None = None


class MtopRateService:
    """商品评价列表和描述、物流、服务 DSR 评分。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_ratings(self, query: OfferRatingsQuery) -> MtopResponse[JsonValue]:
        """查询商品评价分页列表。"""
        return self._transport.request(
            MtopRequest(
                api=RATINGS_API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "beginPage": query.page,
                    "pageSize": query.page_size,
                    "starLevel": query.star_level,
                },
            )
        )

    def get_dsr(self, query: OfferDsrQuery) -> MtopResponse[JsonValue]:
        """查询商品 DSR 评分。"""
        return self._transport.request(
            MtopRequest(
                api=DSR_API,
                version="1.0",
                method="POST",
                data={"offerId": query.offer_id, "scene": query.scene},
            )
        )

    def get_ratings_from_detail(self, query: DetailRatingsQuery) -> MtopResponse[JsonValue]:
        """按商品详情页参数查询评价列表。"""
        return self._transport.request(
            MtopRequest(
                api=RATINGS_API,
                version="1.0",
                method="POST",
                data={
                    "orderFieldForMtop": query.order_field_for_mtop,
                    "page": query.page,
                    "scene": query.scene,
                    "itemId": query.item_id,
                    "loginId": query.login_id,
                    "site": query.site,
                    "pageSize": query.page_size,
                    "tagName": query.tag_name,
                    "tagType": query.tag_type,
                },
                extra_params={
                    "_bx-login": "new",
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )

    def get_dsr_from_detail(self, query: DetailDsrQuery) -> MtopResponse[JsonValue]:
        """按商品详情页参数查询 DSR 评分。"""
        return self._transport.request(
            MtopRequest(
                api=DSR_API,
                version="1.0",
                method="POST",
                data={
                    "loginId": query.login_id,
                    "scene": query.scene,
                    "offerId": query.offer_id,
                    "site": query.site,
                },
                extra_params={
                    "_bx-login": "new",
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )
