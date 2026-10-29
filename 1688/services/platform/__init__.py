"""平台实验、网关与地区接口。"""

from typing import final

from api.transport import MtopTransport
from services._endpoint import EndpointGroup
from services.platform.experiment import AbtestService
from services.platform.gateway import RAW_ENDPOINTS as GATEWAY_ENDPOINTS
from services.platform.region import IpRegionQueryService


@final
class PlatformServices:
    """平台能力客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.experiment = AbtestService(transport)
        self.gateway = EndpointGroup(transport, GATEWAY_ENDPOINTS)
        self.region = IpRegionQueryService(transport)
