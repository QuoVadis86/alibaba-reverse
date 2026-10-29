"""search suggest 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.industry.pc.search.hotword"),
    EndpointSpec("mtop.cbu.global.marketing.search.suggest"),
)
