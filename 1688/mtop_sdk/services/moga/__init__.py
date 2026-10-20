"""1688 MOGA 接口命名空间。"""

from mtop_sdk.services.moga.pc import MogaPcServices
from mtop_sdk.transport import MtopTransport


class MogaServices:
    """`mtop.1688.moga` 下的 MTOP API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.pc = MogaPcServices(transport)
