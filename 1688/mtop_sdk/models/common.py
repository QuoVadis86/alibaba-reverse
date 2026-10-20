"""MTOP 服务共用的数据类型和响应模型。"""

from __future__ import annotations

from dataclasses import dataclass

type JsonValue = (
    str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]
)
type JsonObject = dict[str, JsonValue]


@dataclass(frozen=True, slots=True)
class MtopResponse:
    """统一的 MTOP 响应；业务数据放在 data，原始响应保留在 raw。"""

    ret: tuple[str, ...]
    data: JsonValue | None
    raw: JsonObject

    @property
    def success(self) -> bool:
        """根据 MTOP ret 状态判断请求是否成功。"""
        return any(code == "SUCCESS" or code.startswith("SUCCESS::") for code in self.ret)

    def to_dict(self) -> JsonObject:
        """返回适合 JSON 输出的统一结构。"""
        return {"success": self.success, "ret": list(self.ret), "data": self.data}
