"""AI 用户画像 MTOP 接口。"""

import json
from typing import Final

from pydantic import PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.industry.app.ai.sourcing.user.profile"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.country.search"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.get"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.guide.get"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.guide.report", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.identity.update", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.profile.preference.update", method="POST"),
)


class AiProfileService(EndpointGroup):
    """按页面调用点组装用户画像参数。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_sourcing_user_profile(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.industry.app.ai.sourcing.user.profile")

    def search_countries(
        self, keyword: str = "", limit: PositiveInt = 20
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.cbu.bot.profile.country.search",
            {"keyword": keyword, "limit": str(limit)},
        )

    def get_profile(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.alibaba.cbu.bot.profile.get")

    def report_guide(
        self, guide_type: str, action_type: str
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.cbu.bot.profile.guide.report",
            {"guideType": guide_type, "actionType": action_type},
        )

    def update_preferences(
        self, service_codes: list[str], supplier_codes: list[str]
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.cbu.bot.profile.preference.update",
            {
                "serviceCodes": json.dumps(
                    service_codes, ensure_ascii=False, separators=(",", ":")
                ),
                "supplierCodes": json.dumps(
                    supplier_codes, ensure_ascii=False, separators=(",", ":")
                ),
            },
        )
