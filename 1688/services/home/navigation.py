"""home navigation 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

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
