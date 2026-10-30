"""AI 商品对比 MTOP 接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.bot.compare.add.cart.sku.id.get"),
    EndpointSpec("mtop.1688.bot.compare.assistant.tab.detail.query"),
    EndpointSpec("mtop.1688.bot.compare.detail.query", method="POST"),
    EndpointSpec("mtop.1688.bot.compare.product.switch"),
    EndpointSpec("mtop.1688.pc.privatefeed.aibot.compare.detail.query"),
)


class CompareTabQuery(BaseModel):
    """对比助手标签详情的入口与商品条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    compare_entry_type: str = Field(min_length=1)
    base_offer_id: PositiveInt | None = None
    all_offer_ids: list[PositiveInt] = Field(default_factory=list)


class CompareDetailQuery(BaseModel):
    """商品对比详情的入口与商品列表。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    compare_entry_type: str = Field(min_length=1)
    base_offer_id: PositiveInt
    all_offer_ids: list[PositiveInt] = Field(min_length=1)


class AiCompareService(EndpointGroup):
    """按页面调用点组装商品对比参数。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_cart_sku_ids(self, offer_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.1688.bot.compare.add.cart.sku.id.get", {"offerId": offer_id}
        )

    def get_assistant_tab_detail(
        self, query: CompareTabQuery
    ) -> MtopResponse[JsonValue]:
        payload: dict[str, JsonValue] = {"compareEntryType": query.compare_entry_type}
        if query.base_offer_id is not None:
            payload["baseOfferId"] = query.base_offer_id
        if query.all_offer_ids:
            payload["allOfferIds"] = json.dumps(
                query.all_offer_ids, separators=(",", ":")
            )
        return self.call("mtop.1688.bot.compare.assistant.tab.detail.query", payload)

    def get_detail(self, query: CompareDetailQuery) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.1688.bot.compare.detail.query",
            {
                "compareEntryType": query.compare_entry_type,
                "baseOfferId": query.base_offer_id,
                "allOfferIds": json.dumps(query.all_offer_ids, separators=(",", ":")),
            },
        )

    def switch_product(self, base_offer_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.1688.bot.compare.product.switch", {"baseOfferId": base_offer_id}
        )

    def get_privatefeed_detail(
        self, item_ids: list[PositiveInt], scene: str | None = None
    ) -> MtopResponse[JsonValue]:
        ids: list[JsonValue] = list(item_ids)
        payload: dict[str, JsonValue] = {"itemIds": ids}
        if scene:
            payload["scene"] = scene
        return self.call("mtop.1688.pc.privatefeed.aibot.compare.detail.query", payload)
