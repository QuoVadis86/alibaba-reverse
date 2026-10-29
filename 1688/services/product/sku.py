"""`mtop.1688.wosc.queryOfferSkuSelectorModel` 商品 SKU 接口。"""

from typing import Final

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.wosc.queryOfferSkuSelectorModel"


class OfferSkuService:
    """查询商品 SKU 规格、价格和库存。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def get(self, offer_id: str) -> MtopResponse[JsonValue]:
        """查询一个商品的 SKU 信息。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/155.0.0.0 Safari/537.36"
                    ),
                },
                data={
                    "offerId": offer_id,
                    "useCase": "1688detail",
                    "bizScene": "pcod",
                    "urlParam": "actionType=dxOrder&sk=consign",
                },
                extra_params={
                    "jsv": "2.7.2",
                    # URL 路径转小写，但 api 查询参数保留接口名的驼峰形式。
                    "api": API,
                    "type": "originaljson",
                    "timeout": "20000",
                    "dataType": "jsonp",
                    "callback": None,
                },
            )
        )
