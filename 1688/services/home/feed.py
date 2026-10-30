"""home feed 业务场景的 MTOP 接口。"""

from typing import Final

from pydantic import PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec, MtopCallOptions

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


class HomeFeedService(EndpointGroup):
    """首页私域信息流中已确认参数的查询。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_default_recommend(
        self, page_start: PositiveInt = 1, page_size: PositiveInt = 20
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.1688.pc.privatefeed.default.recommend",
            {"pageStart": page_start, "pageSize": page_size},
        )

    def get_entry_control(self) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.1688.pc.privatefeed.entry.control",
            options=MtopCallOptions(extra_params={"valueType": "original"}),
        )

    def get_item_filter(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.pc.privatefeed.item.filter.query")

    def get_notice(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.pc.privatefeed.notice.query")
