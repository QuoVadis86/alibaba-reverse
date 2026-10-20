"""`mtop.1688.mmga.offerdetail.service` 的全部业务方法。"""

from __future__ import annotations

import json

from mtop_sdk.models.common import JsonObject, JsonValue, MtopResponse
from mtop_sdk.models.offer.logistics import OfferLogisticsQuery
from mtop_sdk.models.shop import ShopRelationQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

API = "mtop.1688.mmga.offerdetail.service"
HEADERS = {"_bx-login": "new"}


class OfferDetailMtopService:
    """详情服务端点下按 serviceName 分发的接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get_config(self, ab_test_key: str) -> MtopResponse[JsonValue]:
        """获取详情页 AB 配置。"""
        return self._call(
            {
                "serviceName": "offerDetailPCABService",
                "abTestKey": ab_test_key,
            }
        )

    def get_logistics(self, query: OfferLogisticsQuery) -> MtopResponse[JsonValue]:
        """查询商品物流时效和保障信息。"""
        return self._call(
            {
                "serviceName": "offerLogisticsService",
                "invokeSource": "pc",
                "channelType": "dsc",
                "offerDeliveryTime": query.offer_delivery_time,
                "offerId": query.offer_id,
                "toAddressCode": query.to_address_code,
                "fromAddressId": query.from_address_id,
                "sellerId": query.seller_id,
                "protectionInfos": json.dumps(
                    query.protection_infos,
                    ensure_ascii=False,
                    separators=(",", ":"),
                ),
                "buyerProtectionModel": json.dumps(
                    query.buyer_protection_model,
                    ensure_ascii=False,
                    separators=(",", ":"),
                ),
            }
        )

    def get_recommendations(self, offer_id: int) -> MtopResponse[JsonValue]:
        """获取详情页推荐商品。"""
        return self._call({"serviceName": "offerRecommendService", "offerId": offer_id})

    def get_shop_relation(self, query: ShopRelationQuery) -> MtopResponse[JsonValue]:
        """查询当前登录会话是否关注指定店铺。"""
        return self._call(
            {
                "serviceName": "shopRelationFnService",
                "shopLoginId": query.shop_login_id,
            }
        )

    def _call(self, payload: JsonObject) -> MtopResponse[JsonValue]:
        """调用 MMGA 详情服务，并为服务端统一附加请求头。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={"mmgaRequest": payload},
                headers=HEADERS,
            )
        )
