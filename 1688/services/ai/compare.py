"""ai compare 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.bot.compare.add.cart.sku.id.get"),
    EndpointSpec("mtop.1688.bot.compare.assistant.tab.detail.query"),
    EndpointSpec("mtop.1688.bot.compare.detail.query", method="POST"),
    EndpointSpec("mtop.1688.bot.compare.product.switch"),
    EndpointSpec("mtop.1688.pc.privatefeed.aibot.compare.detail.query"),
)
