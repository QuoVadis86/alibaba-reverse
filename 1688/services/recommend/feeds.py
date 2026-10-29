"""recommend feeds 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.cbu.global.marketing.new.user.recommend.query"),
    EndpointSpec("mtop.cbu.global.marketing.recommend.catepools.list"),
    EndpointSpec("mtop.cbu.global.marketing.recommend.feeds"),
)
