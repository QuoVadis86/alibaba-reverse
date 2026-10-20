"""SDK 客户端入口。"""

from __future__ import annotations

import httpx2

from mtop_sdk.services.offer import OfferService
from mtop_sdk.transport import MtopTransport


class MtopClient:
    """1688 MTOP SDK；不同业务接口按服务分组挂载。"""

    def __init__(self, http: httpx2.Client, cookie_string: str | None = None) -> None:
        transport = MtopTransport(http, cookie_string)
        self.offer = OfferService(transport)
