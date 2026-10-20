"""1688 MMGA 接口集合。"""

from mtop_sdk.services.mmga.offerdetail import OfferDetailMtopService
from mtop_sdk.transport import MtopTransport


class MmgaServices:
    """`mtop.1688.mmga` 下的 MTOP API。"""

    def __init__(self, transport: MtopTransport) -> None:
        self.offerdetail = OfferDetailMtopService(transport)
