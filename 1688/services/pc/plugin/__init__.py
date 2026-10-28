"""`mtop.1688.pc.plugin` API 命名空间。"""

from api.transport import MtopTransport
from services.pc.plugin.placement import PlacementServices


class PluginServices:
    """PC 插件接口集合。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.placement = PlacementServices(transport)
