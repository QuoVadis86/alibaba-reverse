"""`mtop.alibaba.alisite.cbu.server.moduleasyncservice` 店铺模块接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.alibaba.alisite.cbu.server.ModuleAsyncService"


class ShopMemberQuery(BaseModel):
    """店铺异步模块查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    member_id: str = Field(min_length=1)


class ShopOfferListQuery(BaseModel):
    """店铺商品列表组件的筛选条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    member_id: str = Field(min_length=1)
    keywords: str | None = None
    page_num: PositiveInt = 1
    count: PositiveInt = 30
    sort_type: str = "wangpu_score"
    seller_recommend_filter: bool = False
    mix_filter: bool = False
    tradenum_filter: bool = False
    quantity_begin: int | None = Field(default=None, ge=0)
    shop_url: str | None = None


class ModuleAsyncService:
    """查询店铺头部、认证和商品列表模块。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_header(self, query: ShopMemberQuery) -> MtopResponse[JsonValue]:
        """查询店铺公共头部模块。"""
        return self._get_module("wp_pc_common_header", query.member_id)

    def get_certification(self, query: ShopMemberQuery) -> MtopResponse[JsonValue]:
        """查询店铺认证模块。"""
        return self._get_module("wp_pc_certification", query.member_id)

    def get_offer_list(self, query: ShopOfferListQuery) -> MtopResponse[JsonValue]:
        """查询店铺商品列表及筛选结果。"""
        appdata: JsonObject = {
            "sortType": query.sort_type,
            "sellerRecommendFilter": query.seller_recommend_filter,
            "mixFilter": query.mix_filter,
            "tradenumFilter": query.tradenum_filter,
            "quantityBegin": query.quantity_begin,
            "pageNum": query.page_num,
            "count": query.count,
        }
        if query.keywords is not None:
            appdata["keywords"] = query.keywords
        data = {
            "componentKey": "Wp_pc_common_offerlist",
            "params": json.dumps(
                {"memberId": query.member_id, "appdata": appdata},
                ensure_ascii=False,
                separators=(",", ":"),
            ),
        }
        headers: dict[str, str] | None = None
        if query.shop_url is not None:
            shop_url = query.shop_url.rstrip("/")
            headers = {"Origin": shop_url, "Referer": f"{shop_url}/"}

        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data=data,
                headers=headers,
                extra_params={
                    "jsv": "2.7.5",
                    "type": "json",
                    "valueType": "string",
                    "dataType": "jsonp",
                    "timeout": "10000",
                    "callback": None,
                },
            )
        )

    def _get_module(self, component_key: str, member_id: str) -> MtopResponse[JsonValue]:
        """调用异步模块接口读取指定组件。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "componentKey": component_key,
                    "params": json.dumps({"memberId": member_id}, separators=(",", ":")),
                },
            )
        )
