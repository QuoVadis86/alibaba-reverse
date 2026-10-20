"""负责 MTOP 签名、令牌引导、HTTP 传输和响应解析。"""

from __future__ import annotations

import json
import socket
import time
from dataclasses import dataclass
from http.cookies import SimpleCookie
from typing import Final, Literal, assert_never

import httpx2
from pydantic import TypeAdapter, ValidationError

from mtop_sdk.exceptions import MtopError
from mtop_sdk.models.common import JsonObject, JsonValue, MtopResponse
from mtop_sdk.sign import AppKey, MtopSignInput, RequestData, TimestampMs, Token, compute_sign

APP_KEY: Final = AppKey("12574478")
JSV: Final = "2.7.4"
GATEWAY: Final = "https://h5api.m.1688.com/h5"
TOKEN_COOKIE: Final = "_m_h5_tk"
TOKEN_BOOTSTRAP_API: Final = "mtop.cbu.pc.smart.engine.api.abtest.execute"
JSON_OBJECT_ADAPTER: Final = TypeAdapter(JsonObject)

LIMITS: Final = httpx2.Limits(
    max_connections=50,
    max_keepalive_connections=20,
    keepalive_expiry=30.0,
)
TIMEOUT: Final = httpx2.Timeout(connect=5.0, read=30.0, write=10.0, pool=10.0)
SOCKET_OPTIONS: Final[list[tuple[int, int, int]]] = [
    (socket.IPPROTO_TCP, socket.TCP_NODELAY, 1),
]


@dataclass(frozen=True, slots=True)
class MtopRequest:
    """一个已由接口服务组装好的 MTOP 请求。"""

    api: str
    version: str
    data: JsonObject
    method: Literal["GET", "POST"] = "GET"
    headers: dict[str, str] | None = None


def create_http_client() -> httpx2.Client:
    """创建带超时、连接复用和 HTTP/2 的 HTTP 客户端。"""
    transport = httpx2.HTTPTransport(
        http2=True,
        retries=3,
        limits=LIMITS,
        socket_options=SOCKET_OPTIONS,
    )
    return httpx2.Client(
        transport=transport,
        timeout=TIMEOUT,
        follow_redirects=True,
        headers={"Referer": "https://www.1688.com/"},
    )


class MtopTransport:
    """统一处理 MTOP 公共协议细节，业务接口由 services 模块实现。"""

    def __init__(self, http: httpx2.Client, cookie_string: str | None = None) -> None:
        self._http = http
        self._token = self._load_cookie(cookie_string)

    def request(self, request: MtopRequest) -> MtopResponse[JsonValue]:
        """确保有令牌后发送一个已组装的业务请求。"""
        return self._send(request, self._ensure_token())

    def _load_cookie(self, cookie_string: str | None) -> Token | None:
        """导入可选 Cookie，并读取其中的 MTOP 令牌。"""
        if cookie_string:
            for item in cookie_string.split(";"):
                name, separator, value = item.strip().partition("=")
                if separator and name:
                    self._http.cookies.set(name, value.strip(), domain=".1688.com")

        cookie_value = self._http.cookies.get(TOKEN_COOKIE, domain=".1688.com")
        return None if cookie_value is None else self._token_from_cookie(cookie_value)

    @staticmethod
    def _token_from_cookie(cookie_value: str) -> Token:
        """取 _m_h5_tk 中过期时间前的签名令牌。"""
        token_value, separator, _ = cookie_value.partition("_")
        if not separator or not token_value:
            raise MtopError("_m_h5_tk Cookie 格式不正确")
        return Token(token_value)

    def _ensure_token(self) -> Token:
        """无 token 时用 undefined 签名引导请求，从 Set-Cookie 取令牌。"""
        if self._token is not None:
            return self._token

        bootstrap = MtopRequest(
            api=TOKEN_BOOTSTRAP_API,
            version="1.0",
            data={
                "abtestCode": "20907",
                "extraParams": json.dumps({"from": "pcHome"}, separators=(",", ":")),
            },
        )
        self._send(bootstrap, token=None)
        if self._token is None:
            raise MtopError("引导请求未在 Set-Cookie 响应头中返回 _m_h5_tk")
        return self._token

    def _send(
        self,
        request: MtopRequest,
        token: Token | None,
    ) -> MtopResponse[JsonValue]:
        """签名并发送 GET 或 POST 请求。"""
        data = json.dumps(request.data, ensure_ascii=False, separators=(",", ":"))
        timestamp = TimestampMs(str(int(time.time() * 1000)))
        params = {
            "jsv": JSV,
            "appKey": APP_KEY,
            "api": request.api,
            "v": request.version,
            "type": "jsonp",
            "dataType": "jsonp",
            "callback": "mtopjsonp1",
            "data": data,
            "t": timestamp,
            "sign": compute_sign(
                MtopSignInput(
                    token=token,
                    timestamp_ms=timestamp,
                    app_key=APP_KEY,
                    data=RequestData(data),
                )
            ),
        }

        url = f"{GATEWAY}/{request.api.lower()}/{request.version.lower()}/"
        match request.method:
            case "GET":
                response = self._http.get(url, params=params, headers=request.headers)
            case "POST":
                response = self._http.post(
                    url,
                    params=params,
                    data={"data": data},
                    headers=request.headers,
                )
            case unreachable:
                assert_never(unreachable)

        self._capture_token(response)
        response.raise_for_status()
        return self._parse_response(response.text)

    def _capture_token(self, response: httpx2.Response) -> None:
        """从响应头保存服务端下发的 Cookie 和 MTOP 令牌。"""
        for header in response.headers.get_list("set-cookie"):
            cookies = SimpleCookie()
            cookies.load(header)
            for morsel in cookies.values():
                self._http.cookies.set(
                    morsel.key,
                    morsel.value,
                    domain=morsel["domain"] or ".1688.com",
                    path=morsel["path"] or "/",
                )
                if morsel.key == TOKEN_COOKIE:
                    self._token = self._token_from_cookie(morsel.value)

        # HTTPX 通常也会自动写入 Cookie jar；从中读取作为兼容兜底。
        cookie_value = self._http.cookies.get(TOKEN_COOKIE, domain=".1688.com")
        if cookie_value is not None:
            self._token = self._token_from_cookie(cookie_value)

    @staticmethod
    def _parse_response(response_text: str) -> MtopResponse[JsonValue]:
        """去掉 JSONP 包装，校验响应并提取 MTOP 状态与业务数据。"""
        payload = response_text.strip()
        if payload.startswith("mtopjsonp"):
            start, end = payload.find("("), payload.rfind(")")
            if start < 0 or end <= start:
                raise MtopError("MTOP 返回了格式不完整的 JSONP 响应")
            payload = payload[start + 1 : end]

        try:
            raw = JSON_OBJECT_ADAPTER.validate_json(payload)
        except ValidationError as error:
            raise MtopError("MTOP 返回的内容不是有效 JSON 对象") from error

        ret_value = raw.get("ret")
        if ret_value is None:
            ret: tuple[str, ...] = ()
        elif isinstance(ret_value, str):
            ret = (ret_value,)
        elif isinstance(ret_value, list) and all(isinstance(code, str) for code in ret_value):
            ret = tuple(ret_value)
        else:
            raise MtopError("MTOP 响应中的 ret 字段格式不正确")
        return MtopResponse[JsonValue](ret=ret, data=raw.get("data"), raw=raw)
