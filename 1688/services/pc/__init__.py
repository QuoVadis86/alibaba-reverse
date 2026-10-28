"""`mtop.1688.pc` API 命名空间。"""

from api.transport import MtopTransport
from services.pc.plugin import PluginServices


class PcServices:
    """PC 端接口集合。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.plugin = PluginServices(transport)
