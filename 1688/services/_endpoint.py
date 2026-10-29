"""业务模块共用的原始 MTOP 参数调用器。"""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import ClassVar, Final, Literal, final

from pydantic import BaseModel, ConfigDict

from api.exceptions import MtopError
from api.response import JSON_OBJECT_ADAPTER, JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport


@dataclass(frozen=True, slots=True)
class EndpointSpec:
    """一个业务接口的 MTOP 路径和默认请求方式。"""

    api: str
    version: str = "1.0"
    method: Literal["GET", "POST"] = "GET"


class MtopCallOptions(BaseModel):
    """覆盖版本、请求方法或 MTOP 查询参数。"""

    model_config: ClassVar[ConfigDict] = ConfigDict(frozen=True, extra="forbid")

    version: str | None = None
    method: Literal["GET", "POST"] | None = None
    headers: dict[str, str] | None = None
    extra_params: dict[str, str | None] | None = None
    include_data_in_query: bool = False


@final
class EndpointGroup:
    """只允许调用所属业务模块登记的原始 JSON 接口。"""

    def __init__(
        self, transport: MtopTransport, endpoints: tuple[EndpointSpec, ...]
    ) -> None:
        self._transport = transport
        self._endpoints: Final = MappingProxyType(
            {item.api: item for item in endpoints}
        )
        if len(self._endpoints) != len(endpoints):
            raise MtopError("同一业务模块内存在重复的 MTOP API")

    def list_endpoints(self) -> tuple[EndpointSpec, ...]:
        """列出本业务模块支持的 API。"""
        return tuple(self._endpoints.values())

    def call(
        self,
        api: str,
        data: JsonObject | None = None,
        *,
        options: MtopCallOptions | None = None,
    ) -> MtopResponse[JsonValue]:
        """使用页面原始 JSON 参数调用本组的接口。"""
        spec = self._endpoints.get(api)
        if spec is None:
            raise MtopError(f"该业务模块未收录 MTOP 接口: {api}")
        request_options = options or MtopCallOptions()
        payload = JSON_OBJECT_ADAPTER.validate_python(data if data is not None else {})
        return self._transport.request(
            MtopRequest(
                api=spec.api,
                version=request_options.version or spec.version,
                method=request_options.method or spec.method,
                data=payload,
                headers=request_options.headers,
                extra_params=request_options.extra_params,
                include_data_in_query=request_options.include_data_in_query,
            )
        )
