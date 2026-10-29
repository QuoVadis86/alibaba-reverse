"""`mtop.1688.marketing.coupon.batchApplyCoupon` 批量领券接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, Field

from api.response import JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport

API: Final = "mtop.1688.marketing.coupon.batchApplyCoupon"


class CouponBatchApplyQuery(BaseModel):
    """详情页促销模型给出的待领取优惠券参数。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    coupon_params: list[JsonValue] = Field(min_length=1)


class CouponService:
    """调用批量领券服务。"""

    def __init__(self, transport: MtopTransport) -> None:
        self._transport = transport

    def batch_apply(self, query: CouponBatchApplyQuery) -> MtopResponse[JsonValue]:
        """提交优惠券参数；是否领券成功以 MTOP 响应为准。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="1.0",
                method="POST",
                data={"couponParams": query.coupon_params},
            )
        )
