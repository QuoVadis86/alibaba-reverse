"""首页导航 MTOP 接口。"""

import json
from typing import Final

from pydantic import BaseModel, ConfigDict, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec, MtopCallOptions

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.pc.guide.show"),
    EndpointSpec("mtop.cbu.national.cs.show.entry"),
    EndpointSpec("mtop.cbu.national.multilang.pcindex.catelist"),
    EndpointSpec("mtop.cbu.pc.web.api.data.recallData"),
    EndpointSpec("mtop.cbu.pc.web.api.home.getuserinfo"),
    EndpointSpec("mtop.cbu.pc.web.api.home.slot.control"),
    EndpointSpec("mtop.cbu.pc.web.api.home.storeuserinfo"),
    EndpointSpec("mtop.cbu.pc.web.api.pop.querypreference"),
    EndpointSpec("mtop.cbu.pc.web.api.pop.querypreferenceshow"),
)


class PreferenceShowQuery(BaseModel):
    """首页偏好展示的筛选与分页条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    page_no: PositiveInt = 1
    page_size: PositiveInt = 20
    keyword: str = ""
    category_level1_id: str = ""


class HomeNavigationService(EndpointGroup):
    """首页导航中已确认参数的查询。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_guide_show(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.pc.guide.show")

    def get_customer_service_entry(self) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.national.cs.show.entry",
            options=MtopCallOptions(extra_params={"dataType": "json"}),
        )

    def get_multilang_categories(
        self, user_id: int = 0, *, version: str | None = None
    ) -> MtopResponse[JsonValue]:
        payload: dict[str, JsonValue] = {"userId": user_id}
        if version is not None:
            payload["version"] = version
        return self.call("mtop.cbu.national.multilang.pcindex.catelist", payload)

    def recall_user_panel(
        self, message_card_black_list: str = ""
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.web.api.data.recallData",
            {
                "bizCode": "USER_PANEL",
                "needDowngrade": True,
                "timeout": 3000,
                "inputParams": json.dumps(
                    {"messageCardBlackList": message_card_black_list},
                    separators=(",", ":"),
                ),
            },
            options=MtopCallOptions(extra_params={"dataType": "json"}),
        )

    def get_slot_control(
        self,
        spmc: str = "",
        scene_code: str = "pcHome_central",
        from_source: str = "PC",
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.web.api.home.slot.control",
            {"spmc": spmc, "sceneCode": scene_code, "fromSource": from_source},
            options=MtopCallOptions(
                extra_params={"ecode": "0", "valueType": "original"}
            ),
        )

    def get_preference(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.cbu.pc.web.api.pop.querypreference")

    def get_preference_show(
        self, query: PreferenceShowQuery = PreferenceShowQuery()
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.web.api.pop.querypreferenceshow",
            {
                "pageNo": query.page_no,
                "pageSize": query.page_size,
                "keyword": query.keyword,
                "categoryLevel1Id": query.category_level1_id,
            },
        )
