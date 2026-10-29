"""ai demand 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec("mtop.1688.opp.sel.aibot.querydownstreamperformance"),
    EndpointSpec("mtop.1688.opp.sel.aibot.querysupportedcountries"),
    EndpointSpec("mtop.alibaba.cbu.bot.purchase.demand.task.list"),
    EndpointSpec(
        "mtop.alibaba.global1688.silicon.bot.demand.addorupdatebycate", method="POST"
    ),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.all.bf.list"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.clarify.bf.list"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.editbyid", method="POST"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.getbyid"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.getbyitem"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.demand.satisfaction.get"),
    EndpointSpec("mtop.alibaba.global1688.silicon.bot.item.query"),
)
