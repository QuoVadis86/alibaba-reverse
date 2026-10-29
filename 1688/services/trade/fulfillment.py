"""`mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer` 接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.alibaba.carriagecenter.fulfillmentsolution.query4offer"


class FulfillmentQuery(BaseModel):
    """商品履约配送方案查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    amount: PositiveInt = 1
    address_code: str = Field(default="440300", min_length=1)


class DetailFulfillmentQuery(BaseModel):
    """商品详情页履约方案请求所需的完整上下文。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    offer_id: PositiveInt
    seller_user_id: PositiveInt
    offer_tag_map: dict[str, str]
    cate_lv1_id: PositiveInt
    cate_lv2_id: PositiveInt
    cate_lv3_id: PositiveInt
    marketing_free_postage: bool
    to_address_code: str = Field(min_length=1)
    from_address_code: str = Field(min_length=1)


class FulfillmentSolutionService:
    """查询指定地区和购买数量的履约配送方案。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, query: FulfillmentQuery) -> MtopResponse[JsonValue]:
        """查询商品履约方案。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "amount": query.amount,
                    "addressCode": query.address_code,
                },
            )
        )

    def get_from_detail(self, query: DetailFulfillmentQuery) -> MtopResponse[JsonValue]:
        """按商品详情页上下文查询履约配送方案。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={
                    "offerId": query.offer_id,
                    "sellerUserId": query.seller_user_id,
                    "offerTagMap": query.offer_tag_map,
                    "cateLv1Id": query.cate_lv1_id,
                    "cateLv2Id": query.cate_lv2_id,
                    "cateLv3Id": query.cate_lv3_id,
                    "marketingFreePostage": query.marketing_free_postage,
                    "toAddressCode": query.to_address_code,
                    "fromAddressCode": query.from_address_code,
                },
                extra_params={
                    "_bx-login": "new",
                    "type": "originaljson",
                    "timeout": "20000",
                    "callback": None,
                },
            )
        )
