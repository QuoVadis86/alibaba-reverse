"""`mtop.1688.moga.pc.shopcard` 店铺卡片接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.moga.pc.shopcard"


class ShopCardQuery(BaseModel):
    """店铺卡片所需的商品和卖家标识。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    seller_user_id: PositiveInt
    seller_member_id: str = Field(min_length=1)
    winport_url: str = ""
    top_category_id: PositiveInt = 15


class ShopCardDetailQuery(BaseModel):
    """详情页抓包中的完整店铺卡片上下文。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    offer_member_tags: list[PositiveInt]
    seller_user_id: PositiveInt
    seller_member_id: str = Field(min_length=1)
    offer_model_sign: dict[str, bool]
    seller_identity: str = Field(min_length=1)
    seller_winport_url_map: dict[str, str]
    winport_url: str = Field(min_length=1)
    user_id: int = 0


class ShopCardService:
    """查询店铺名称、评分和粉丝等卡片信息。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: ShopCardQuery) -> MtopResponse[JsonValue]:
        """根据商品和卖家信息查询店铺卡片。"""
        base_url = (query.winport_url or f"https://shop{query.seller_user_id}.1688.com").rstrip("/")
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "userId": 0,
                    "offerMemberTags": [],
                    "sellerUserId": query.seller_user_id,
                    "sellerMemberId": query.seller_member_id,
                    "topCategoryId": query.top_category_id,
                    "winportUrl": base_url,
                    "sellerWinportUrlMap": {
                        "indexUrl": f"{base_url}/page/index.html",
                        "contactinfoUrl": f"{base_url}/page/contactinfo.html",
                        "creditdetailUrl": f"{base_url}/page/creditdetail.html",
                        "offerlistUrl": f"{base_url}/page/index.html",
                        "shopdynamicUrl": f"{base_url}/page/shopdynamic.html",
                        "defaultUrl": base_url,
                    },
                    "sellerIdentity": "cht",
                },
            )
        )

    def get_from_detail(self, query: ShopCardDetailQuery) -> MtopResponse[JsonValue]:
        """按商品详情页传入的上下文查询店铺卡片。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "userId": query.user_id,
                    "offerMemberTags": query.offer_member_tags,
                    "sellerUserId": query.seller_user_id,
                    "sellerMemberId": query.seller_member_id,
                    "offerModelSign": query.offer_model_sign,
                    "sellerIdentity": query.seller_identity,
                    "sellerWinportUrlMap": query.seller_winport_url_map,
                    "winportUrl": query.winport_url,
                },
                extra_params={"type": "originaljson", "timeout": "20000", "callback": None},
            )
        )
