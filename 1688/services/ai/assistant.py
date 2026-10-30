"""AI 助手 MTOP 接口。"""

from typing import Final

from pydantic import BaseModel, ConfigDict, PositiveInt

from api.response import JsonValue, MtopResponse
from api.transport import MtopTransport
from services._endpoint import EndpointGroup, EndpointSpec

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


class NativeFeedbackQuery(BaseModel):
    """AI 助手反馈请求中的会话和反馈值。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    session_id: str
    query_id: str
    feedback: str


class BubbleActionQuery(BaseModel):
    """气泡交互上报所需的追踪和动作字段。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    trace_id: str
    action_type: str
    scene: str
    bubble_type: str
    action_code: str


class AiAssistantService(EndpointGroup):
    """按页面调用点封装已确认参数的 AI 助手接口。"""

    def __init__(self, transport: MtopTransport) -> None:
        super().__init__(transport, RAW_ENDPOINTS)

    def get_scene_adaptation(self, item_id: PositiveInt) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.bot.scene.adaptation", {"itemId": item_id})

    def get_entry_crowds(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.pc.ai.entrence.crowds.query")

    def get_guess(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.1688.pc.privatefeed.aibot.guess")

    def init_native_pc(
        self, scene: str, offer_id: PositiveInt
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.cbu.ai.native.pc.init",
            {"scene": scene, "offerId": offer_id},
        )

    def submit_native_feedback(
        self, query: NativeFeedbackQuery
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.cbu.ai.native.feedback",
            {
                "sessionId": query.session_id,
                "queryId": query.query_id,
                "feedback": query.feedback,
                "terminal": "pc",
            },
        )

    def get_bubble(self, scene: str) -> MtopResponse[JsonValue]:
        return self.call("mtop.alibaba.cbu.bot.bubble.get", {"scene": scene})

    def report_bubble_action(self, query: BubbleActionQuery) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.alibaba.cbu.bot.bubble.action.report",
            {
                "traceId": query.trace_id,
                "actionType": query.action_type,
                "scene": query.scene,
                "bubbleType": query.bubble_type,
                "actionCode": query.action_code,
            },
        )

    def show_global_alpha_bot(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.alibaba.cbu.global.alpha.bot.show")

    def init_global_alpha_task(self) -> MtopResponse[JsonValue]:
        return self.call("mtop.alibaba.cbu.global.alpha.task.init")

    def access_tiansuo_dialog(
        self, scene_code: str = "SC_b2dcb1600", is_draft: bool = False
    ) -> MtopResponse[JsonValue]:
        return self.call(
            "mtop.cbu.pc.tiansuo.engine.dialog.access",
            {"sceneCode": scene_code, "isDraft": is_draft},
        )
