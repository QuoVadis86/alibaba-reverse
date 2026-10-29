"""trade cart 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec(
        "com.alibaba.china.buy.service.purchase.MtopPurchaseService.addCargo",
        method="POST",
    ),
    EndpointSpec(
        "mtop.1688.mtoppurchaseservice.querypurchasehighlightskus", method="POST"
    ),
    EndpointSpec("mtop.alibaba.tradedata.center.fastbuy.access", method="POST"),
)
