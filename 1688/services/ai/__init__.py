"""AI 助手、商品对比、采购需求和画像接口。"""

from typing import final

from api.transport import MtopTransport
from services._endpoint import EndpointGroup
from services.ai.assistant import RAW_ENDPOINTS as ASSISTANT_ENDPOINTS
from services.ai.compare import RAW_ENDPOINTS as COMPARE_ENDPOINTS
from services.ai.demand import RAW_ENDPOINTS as DEMAND_ENDPOINTS
from services.ai.profile import RAW_ENDPOINTS as PROFILE_ENDPOINTS


@final
class AiServices:
    """AI 域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.assistant = EndpointGroup(transport, ASSISTANT_ENDPOINTS)
        self.compare = EndpointGroup(transport, COMPARE_ENDPOINTS)
        self.demand = EndpointGroup(transport, DEMAND_ENDPOINTS)
        self.profile = EndpointGroup(transport, PROFILE_ENDPOINTS)
