"""`mtop.1688.moga.pc.shopcard` 店铺卡片接口。"""

from typing import Final

from mtop_sdk.models.common import JsonValue, MtopResponse
from mtop_sdk.models.shop import ShopCardQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.moga.pc.shopcard"


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
