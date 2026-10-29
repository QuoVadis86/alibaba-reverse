"""1688 MTOP SDK 的公开调用入口。"""

from __future__ import annotations

from typing import TYPE_CHECKING

from api.response import MtopResponse
from api.transport import create_http_client

if TYPE_CHECKING:
    from api.client import MtopClient
    from services.product.detail import OfferDetailData
    from services.product.detail_extra import OfferLogisticsQuery

__all__ = [
    "MtopClient",
    "MtopResponse",
    "OfferDetailData",
    "OfferLogisticsQuery",
    "create_http_client",
]


def __getattr__(name: str) -> type[MtopClient] | type[OfferDetailData] | type[OfferLogisticsQuery]:
    """延迟加载客户端和服务模型，避免服务模块导入时出现循环依赖。"""
    match name:
        case "MtopClient":
            from api.client import MtopClient

            return MtopClient
        case "OfferDetailData":
            from services.product.detail import OfferDetailData

            return OfferDetailData
        case "OfferLogisticsQuery":
            from services.product.detail_extra import OfferLogisticsQuery

            return OfferLogisticsQuery
        case _:
            raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
