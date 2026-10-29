"""trade order 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.alibaba.cbu.bot.order.follow.detail.query", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.order.follow.module.query", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.order.follow.urge", method="POST"),
)
