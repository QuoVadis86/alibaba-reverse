"""构造滑块校验请求中已确认的明文字段，不求解风控令牌。"""

from __future__ import annotations

import json
import random
import time
from dataclasses import dataclass
from typing import Final
from urllib.parse import quote

FIREYE_VERSION: Final = "1.234.37"
PAGE_VERSION: Final = "0.1.129"
NC_JS_VERSION: Final = 1
JS_URI_SAFE: Final = "-_.!~*'()"


@dataclass(frozen=True, slots=True)
class ButtonRect:
    """滑块按钮 getBoundingClientRect() 的八个数值。"""

    x: int | float
    y: int | float
    width: int | float
    height: int | float
    top: int | float
    bottom: int | float
    left: int | float
    right: int | float


@dataclass(frozen=True, slots=True)
class TrackGeometry:
    """轨道尺寸和沿 offsetParent 链累加的位置，单位为 CSS 像素。"""

    width: int
    height: int
    absolute_left: int
    absolute_top: int


@dataclass(frozen=True, slots=True)
class SlideRequestInput:
    """页面配置、DOM 几何值及尚需浏览器模块提供的动态值。"""

    appkey: str
    token: str
    secdata: str
    fy_token: str
    umid_token: str
    rand_value: str
    button: ButtonRect
    track: TrackGeometry
    et_ready: bool
    scene: str = "register"
    language: str = "cn"
    ppt_ms: int | None = None
    landscape: bool = False
    timestamp_ms: int | None = None
    request_v: str | None = None


@dataclass(frozen=True, slots=True)
class SlideRequest:
    """可按 JS encodeURIComponent 规则编码的请求参数。"""

    slidedata: str
    x5secdata: str
    rand_value: str
    timestamp_ms: int
    request_v: str
    ppt_ms: int | None
    landscape: bool

    def to_query_string(self) -> str:
        pairs = [("slidedata", self.slidedata), ("x5secdata", self.x5secdata)]
        if self.ppt_ms is not None:
            pairs.append(("ppt", str(self.ppt_ms)))
        pairs.append(("_rand", self.rand_value))
        if self.landscape:
            pairs.append(("landscape", "1"))
        pairs.extend(
            (
                ("ts", str(self.timestamp_ms)),
                ("fireyeVersion", FIREYE_VERSION),
                ("pageVersion", PAGE_VERSION),
                ("v", self.request_v),
            )
        )
        return "&".join(
            f"{quote(name, safe=JS_URI_SAFE)}={quote(value, safe=JS_URI_SAFE)}"
            for name, value in pairs
        )


def build_nc_button(rect: ButtonRect) -> str:
    values = (
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        rect.top,
        rect.bottom,
        rect.left,
        rect.right,
    )
    return "|".join(_js_number(value) for value in values)


def build_nc_session_id(geometry: TrackGeometry) -> str:
    """复现 nc.js 的 parseInt(width+'a'+height+'a'+left+'a'+top, 11).toString(16)。"""
    base11 = (
        f"{geometry.width}a{geometry.height}a"
        f"{geometry.absolute_left}a{geometry.absolute_top}"
    )
    return format(int(base11, 11), "x")


def build_slide_request(inputs: SlideRequestInput) -> SlideRequest:
    """将已知明文字段组装为滑块 GET 请求；动态令牌由调用方提供。"""
    trans = {
        "ncbtn": build_nc_button(inputs.button),
        "umidToken": inputs.umid_token,
        "ncSessionID": build_nc_session_id(inputs.track),
        "et": "1" if inputs.et_ready else "0",
    }
    slide_data = {
        "a": inputs.appkey,
        "t": inputs.token,
        "n": inputs.fy_token,
        "p": _json_stringify(trans),
        "scene": inputs.scene,
        "asyn": 0,
        "lang": inputs.language,
        "v": NC_JS_VERSION,
    }
    return SlideRequest(
        slidedata=_json_stringify(slide_data),
        x5secdata=inputs.secdata,
        rand_value=inputs.rand_value,
        timestamp_ms=(
            inputs.timestamp_ms
            if inputs.timestamp_ms is not None
            else time.time_ns() // 1_000_000
        ),
        request_v=(
            inputs.request_v
            if inputs.request_v is not None
            else str(random.random()).replace(".", "", 1)
        ),
        ppt_ms=inputs.ppt_ms,
        landscape=inputs.landscape,
    )


def _json_stringify(value: dict[str, str | int]) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _js_number(value: int | float) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)
