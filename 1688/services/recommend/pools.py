"""recommend pools 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec(
        "mtop.1688.wirelesscenter.recommend.getpokerirecomcard", method="POST"
    ),
    EndpointSpec("mtop.1688.wirelesscenter.recommend.pc.getAllCategory", method="POST"),
    EndpointSpec(
        "mtop.1688.wirelesscenter.recommend.pc.getHotProductPoolId", method="POST"
    ),
)
