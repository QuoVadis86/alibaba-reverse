"""MTOP 服务共用的数据类型和响应模型。"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, TypeAdapter

type JsonValue = (
    str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]
)
type JsonObject = dict[str, JsonValue]
JSON_OBJECT_ADAPTER = TypeAdapter(JsonObject)


class MtopResponse[T](BaseModel):
    """统一的 MTOP 响应；业务数据放在 data，原始响应保留在 raw。"""

    model_config = ConfigDict(frozen=True)

    ret: tuple[str, ...]
    data: T | None
    raw: JsonObject

    @property
    def success(self) -> bool:
        """根据 MTOP ret 状态判断请求是否成功。"""
        return any(code == "SUCCESS" or code.startswith("SUCCESS::") for code in self.ret)

    def to_dict(self) -> JsonObject:
        """返回适合 JSON 输出的统一结构。"""
        result = JSON_OBJECT_ADAPTER.validate_python(
            self.model_dump(mode="json", by_alias=True, exclude={"raw"})
        )
        return {**result, "success": self.success}
