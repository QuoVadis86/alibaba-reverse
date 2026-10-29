"""platform gateway 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.ali.ww.cbu.web.gateway"),
    EndpointSpec("mtop.mbox.fc.common.gateway"),
)
