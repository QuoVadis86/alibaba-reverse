"""search categories 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.cbu.pc.web.api.cate.querycategories", method="POST"),
)
