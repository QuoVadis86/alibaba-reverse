"""home feed 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.pc.privatefeed.attention"),
    EndpointSpec("mtop.1688.pc.privatefeed.default.recommend"),
    EndpointSpec("mtop.1688.pc.privatefeed.entry.control"),
    EndpointSpec("mtop.1688.pc.privatefeed.item.filter.query"),
    EndpointSpec("mtop.1688.pc.privatefeed.item.list"),
    EndpointSpec("mtop.1688.pc.privatefeed.item.similar.preview.query"),
    EndpointSpec("mtop.1688.pc.privatefeed.notice.query"),
    EndpointSpec("mtop.1688.pc.privatefeed.supplier.filter.query"),
    EndpointSpec("mtop.1688.pc.privatefeed.supplier.list"),
)
