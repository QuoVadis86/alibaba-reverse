#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "httpx2[http2,brotli,zstd]",
#     "pydantic",
#     "typer",
# ]
# ///

# ─── How to run ───
# 1. Install uv (if not installed):
#      curl -LsSf https://astral.sh/uv/install.sh | sh
# 2. Run: uv run 1688/tools/mtop_client.py 566344866833
# 3. Or make executable and run:
#      chmod +x 1688/tools/mtop_client.py && ./1688/tools/mtop_client.py 566344866833
# ──────────────────

"""通过 1688 MTOP 接口查询单个商品的 SKU 信息。"""

from __future__ import annotations

import hashlib
import json
import socket
import time
from dataclasses import dataclass
from typing import Final, Literal, assert_never

import httpx2
import typer
from pydantic import TypeAdapter, ValidationError

from mtop_sign import (
    AppKey,
    MtopSignInput,
    RequestData,
    TimestampMs,
    Token,
    compute_sign,
)

# 接口参数来自本地 MTOP 请求记录；实际服务端版本可能变化。
APP_KEY: Final = AppKey("12574478")
JSV: Final = "2.7.4"
GATEWAY: Final = "https://h5api.m.1688.com/h5"
TOKEN_COOKIE: Final = "_m_h5_tk"
SKU_API: Final = "mtop.1688.wosc.queryOfferSkuSelectorModel"

# 用递归类型描述 JSON，避免把服务端响应当作无类型数据处理。
type JsonValue = (
    str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]
)
type JsonObject = dict[str, JsonValue]
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
    """描述一个 MTOP 请求。"""

    api: str
    version: str
    data: JsonObject
    method: Literal["GET", "POST"] = "GET"


class MtopError(RuntimeError):
    """表示令牌获取或 MTOP 响应格式错误。"""


def create_http_client() -> httpx2.Client:
    """创建带超时、连接复用和 HTTP/2 的客户端。"""
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


class MtopClient:
    """使用浏览器 Cookie 调用 MTOP 接口。"""

    def __init__(self, http: httpx2.Client, cookie_string: str) -> None:
        self._http = http
        self._token = self._load_cookie(cookie_string)

    def _load_cookie(self, cookie_string: str) -> Token:
        """导入浏览器 Cookie，并提取签名所需的令牌。"""
        for item in cookie_string.split(";"):
            name, separator, value = item.strip().partition("=")
            if separator and name:
                self._http.cookies.set(name, value.strip(), domain=".1688.com")

        cookie_value = self._http.cookies.get(TOKEN_COOKIE, domain=".1688.com")
        if cookie_value is None:
            raise MtopError("Cookie 中缺少 _m_h5_tk；请传入已授权的浏览器会话 Cookie")

        token_value, separator, _ = cookie_value.partition("_")
        if not separator or not token_value:
            raise MtopError("_m_h5_tk Cookie 格式不正确")
        return Token(token_value)

    def get_offer_sku(self, offer_id: str) -> JsonObject:
        """查询一个商品的 SKU 规格、价格和库存信息。"""
        request = MtopRequest(
            api=SKU_API,
            version="1.0",
            method="POST",
            data={
                "offerId": offer_id,
                "useCase": "1688detail",
                "bizScene": "pcod",
                "urlParam": "actionType=dxOrder&sk=consign",
            },
        )
        return self.request(request)

    def request(self, request: MtopRequest) -> JsonObject:
        """对请求参数签名并发送请求，返回 MTOP JSON 响应。"""
        return self._send(request, self._token)

    def _send(self, request: MtopRequest, token: Token | None) -> JsonObject:
        """组装参数、计算签名，并发送 GET 或 POST 请求。"""
        data = json.dumps(request.data, ensure_ascii=False, separators=(",", ":"))
        params = {
            "jsv": JSV,
            "appKey": APP_KEY,
            "api": request.api,
            "v": request.version,
            "type": "jsonp",
            "dataType": "jsonp",
            "callback": "mtopjsonp1",
            "data": data,
        }

        # 引导请求不带签名；拿到 Cookie 后的接口请求使用同一份原始 data 签名。
        if token is not None:
            timestamp = TimestampMs(str(int(time.time() * 1000)))
            params["t"] = timestamp
            params["sign"] = compute_sign(
                MtopSignInput(
                    token=token,
                    timestamp_ms=timestamp,
                    app_key=APP_KEY,
                    data=RequestData(data),
                )
            )

        url = f"{GATEWAY}/{request.api.lower()}/{request.version.lower()}/"
        match request.method:
            case "GET":
                response = self._http.get(url, params=params)
            case "POST":
                response = self._http.post(
                    url,
                    params=params,
                    data={"data": data},
                )
            case unreachable:
                assert_never(unreachable)

        response.raise_for_status()
        return self._parse_response(response.text)

    @staticmethod
    def _parse_response(response_text: str) -> JsonObject:
        """去掉 JSONP 包装并校验响应是 JSON 对象。"""
        payload = response_text.strip()
        if payload.startswith("mtopjsonp"):
            start = payload.find("(")
            end = payload.rfind(")")
            if start < 0 or end <= start:
                raise MtopError("MTOP 返回了格式不完整的 JSONP 响应")
            payload = payload[start + 1 : end]

        try:
            return JSON_OBJECT_ADAPTER.validate_json(payload)
        except ValidationError as error:
            raise MtopError("MTOP 返回的内容不是有效 JSON 对象") from error


def main(
    offer_id: str,
    cookie: str = typer.Option(..., envvar="MTOP_COOKIE", hide_input=True),
) -> None:
    """查询商品 SKU 并将响应以格式化 JSON 输出。"""
    try:
        if not offer_id.isdecimal():
            raise MtopError("商品 ID 必须是数字")
        with create_http_client() as http:
            result = MtopClient(http, cookie).get_offer_sku(offer_id)
    except (httpx2.HTTPError, MtopError) as error:
        typer.echo(f"查询失败：{error}", err=True)
        raise typer.Exit(code=1) from error

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    typer.run(main)
