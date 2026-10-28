"""`mtop.1688.pc.plugin.placement` API 命名空间。"""

from api.transport import MtopTransport
from services.pc.plugin.placement.decision import PlacementDecisionService


class PlacementServices:
    """页面插件位点接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.decision = PlacementDecisionService(transport)
