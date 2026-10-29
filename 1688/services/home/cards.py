"""home cards 业务场景的 MTOP 接口。"""

from typing import Final

from services._endpoint import EndpointSpec

RAW_ENDPOINTS: Final = (
    EndpointSpec(
        "mtop.cbu.pc.channels.api.getBizOpportunityChannelInfo", method="POST"
    ),
    EndpointSpec("mtop.cbu.pc.home.instantretail.getinstantretailhomecard"),
    EndpointSpec("mtop.cbu.pc.home.midcontrol.listDoorsV2"),
    EndpointSpec("mtop.cbu.pc.home.newarrival.queryNewArrival"),
    EndpointSpec("mtop.cbu.pc.home.newoffer.getNewOffersHomeCard"),
    EndpointSpec("mtop.cbu.pc.home.recommend.listCardsV2"),
    EndpointSpec("mtop.cbu.pc.newuser.listHomeCardOffers"),
    EndpointSpec("mtop.cbu.pc.web.api.home.queryrankingoffers"),
    EndpointSpec("mtop.cbu.pc.web.api.opportunity.getOpportunityHomeCard"),
)
