"""ai assistant 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.bot.scene.adaptation"),
    EndpointSpec("mtop.1688.pc.ai.entrence.crowds.query"),
    EndpointSpec("mtop.1688.pc.privatefeed.aibot.guess"),
    EndpointSpec("mtop.1688.pc.privatefeed.aibot.similar.query"),
    EndpointSpec("mtop.1688.pc.privatefeed.aibot.supplier.risk.query"),
    EndpointSpec("mtop.alibaba.cbu.ai.native.feedback"),
    EndpointSpec("mtop.alibaba.cbu.ai.native.pc.init"),
    EndpointSpec("mtop.alibaba.cbu.bot.bubble.action.report", method="POST"),
    EndpointSpec("mtop.alibaba.cbu.bot.bubble.get"),
    EndpointSpec("mtop.alibaba.cbu.global.alpha.bot.show"),
    EndpointSpec("mtop.alibaba.cbu.global.alpha.task.init"),
    EndpointSpec("mtop.cbu.pc.tiansuo.engine.dialog.access"),
)
