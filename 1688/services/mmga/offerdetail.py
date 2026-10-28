"""`mtop.1688.mmga.offerdetail.service` 的全部业务方法。"""

from __future__ import annotations

import json

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API = "mtop.1688.mmga.offerdetail.service"
HEADERS = {"_bx-login": "new"}


class OfferLogisticsQuery(BaseModel):
    """物流查询入参，值来自商品详情上下文。"""

    model_config = ConfigDict(frozen=True, populate_by_name=True, extra="forbid")

    offer_id: PositiveInt = Field(alias="offerId")
    seller_id: PositiveInt = Field(alias="sellerId")
    to_address_code: str = Field(default="440300", alias="toAddressCode")
    from_address_id: str = Field(default="", alias="fromAddressId")
    protection_infos: list[JsonValue] = Field(default_factory=list, alias="protectionInfos")
    buyer_protection_model: list[JsonValue] = Field(
        default_factory=list, alias="buyerProtectionModel"
    )
    offer_delivery_time: int = Field(default=0, alias="offerDeliveryTime", ge=0)


class ShopRelationQuery(BaseModel):
    """检查当前会话与店铺的关注关系。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    shop_login_id: str = Field(min_length=1)


class OfferRateCardInfoQuery(BaseModel):
    """商品评价卡片汇总接口的商品和卖家信息。"""

    model_config = ConfigDict(frozen=True, populate_by_name=True, extra="forbid")

    offer_id: PositiveInt = Field(alias="offerId")
    seller_login_id: str = Field(alias="sellerLoginId", min_length=1)
    seller_member_id: str = Field(alias="sellerMemberId", min_length=1)


class OfferSubscriptionQuery(BaseModel):
    """商品订阅日历的查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    calendar: str = "1"
    activity_start_timestamps: str = "0"
    activity_end_timestamps: str = "0"


class OfferAiIndexQuery(BaseModel):
    """详情页 AI 索引查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    offer_member_tags: list[PositiveInt]
    buyer_offline_crowds: list[JsonValue] = Field(default_factory=list)


class OfferSellPointQuery(BaseModel):
    """详情页卖点查询所需的商品和卖家上下文。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    offer_member_tags: list[PositiveInt]
    seller_user_id: PositiveInt
    seller_member_id: str = Field(min_length=1)
    offer_signs: dict[str, bool]
    buyer_offline_crowds: list[JsonValue] = Field(default_factory=list)
    user_id: int = 0
    use_ai_bot: bool = False
    scene: str = "new26pc"


class SimilarOffersQuery(BaseModel):
    """详情页同款商品查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    query_source: str = "PC"
    need_sort: bool = True


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

    def get_subscription(self, query: OfferSubscriptionQuery) -> MtopResponse[JsonValue]:
        """查询商品订阅日历。"""
        return self._call(
            {
                "serviceName": "querySubscribeService",
                "offerId": query.offer_id,
                "calendar": query.calendar,
                "extra": {
                    "activityStartTimestamps": query.activity_start_timestamps,
                    "activityEndTimestamps": query.activity_end_timestamps,
                },
            }
        )

    def get_ai_index(self, query: OfferAiIndexQuery) -> MtopResponse[JsonValue]:
        """查询详情页 AI 索引数据。"""
        return self._call(
            {
                "serviceName": "NewYxAiIndexPCService",
                "offerId": query.offer_id,
                "offerMemberTags": query.offer_member_tags,
                "buyerOfflineCrowds": query.buyer_offline_crowds,
            }
        )

    def get_barcode(self, offer_id: int) -> MtopResponse[JsonValue]:
        """查询商品条码。"""
        return self._call({"serviceName": "offerBarCodeService", "offerId": offer_id})

    def get_sell_points(self, query: OfferSellPointQuery) -> MtopResponse[JsonValue]:
        """查询 PC 商品详情页卖点。"""
        return self._call(
            {
                "serviceName": "offerPCSellPointQueryService",
                "scene": query.scene,
                "offerId": query.offer_id,
                "userId": query.user_id,
                "offerMemberTags": query.offer_member_tags,
                "sellerUserId": query.seller_user_id,
                "offerSigns": query.offer_signs,
                "sellerMemberId": query.seller_member_id,
                "buyerOfflineCrowds": query.buyer_offline_crowds,
                "useAiBot": query.use_ai_bot,
            }
        )

    def get_decision_attributes(self, offer_id: int) -> MtopResponse[JsonValue]:
        """查询商品决策属性。"""
        return self._call({"serviceName": "decisionAttrService", "offerId": offer_id})

    def get_delivery_time(self, offer_id: int) -> MtopResponse[JsonValue]:
        """查询商品预计发货时间。"""
        return self._call(
            {"serviceName": "queryOfferDeliveryTimeService", "offerId": offer_id}
        )

    def get_similar_offers(self, query: SimilarOffersQuery) -> MtopResponse[JsonValue]:
        """查询详情页相似同款商品。"""
        return self._call(
            {
                "serviceName": "offerSimilarSameService",
                "offerId": query.offer_id,
                "querySource": query.query_source,
                "needSort": query.need_sort,
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

    def get_rate_card_info(
        self,
        query: OfferRateCardInfoQuery,
    ) -> MtopResponse[JsonValue]:
        """获取商品详情页评价卡片聚合信息。"""
        return self._call(
            {
                "serviceName": "pcOdRateCardInfoMergeService",
                "offerId": query.offer_id,
                "sellerLoginId": query.seller_login_id,
                "sellerMemberId": query.seller_member_id,
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
                extra_params={
                    "_bx-login": "new",
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )
