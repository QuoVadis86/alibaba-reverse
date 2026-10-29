"""ai profile 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.industry.app.ai.sourcing.user.profile"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.country.search"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.get"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.guide.get"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.guide.report", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.identity.update", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.preference.update", method="POST"),
)
