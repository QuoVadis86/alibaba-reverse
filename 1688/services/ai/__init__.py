"""AI 助手、商品对比、采购需求和画像接口。"""

from typing import final

from api.transport import MtopTransport
from services.ai.assistant import AiAssistantService
from services.ai.compare import AiCompareService
from services.ai.demand import AiDemandService
from services.ai.profile import AiProfileService


@final
class AiServices:
    """AI 域客户端入口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.assistant = AiAssistantService(transport)
        self.compare = AiCompareService(transport)
        self.demand = AiDemandService(transport)
        self.profile = AiProfileService(transport)
