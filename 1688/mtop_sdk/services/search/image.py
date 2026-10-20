"""商品图片搜索接口。"""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Final
from urllib.parse import urlsplit

import httpx2

from mtop_sdk.exceptions import MtopError
from mtop_sdk.models.common import JsonObject, JsonValue, MtopResponse
from mtop_sdk.models.search import ImageIdSearchQuery, ImageSearchQuery
from mtop_sdk.transport import MtopRequest, MtopTransport

SEARCH_API: Final = "mtop.relationrecommend.WirelessRecommend.recommend"


class ImageSearchService:
    """支持上传图片 ID 搜索和通过图片 URL 搜索相似商品。"""

    def __init__(self, transport: MtopTransport, http: httpx2.Client) -> None:
        self._transport = transport
        self._http = http

    def upload(self, image_source: str) -> str:
        """上传本地图片或远程图片 URL，并返回服务端 imageId。"""
        image_bytes = self._read_image(image_source)
        params = {
            "method": "uploadBase64WithRequest",
            "beginPage": 1,
            "pageSize": 60,
            "searchScene": "pcImageSearch",
            "appName": "pctusou",
            "imageBase64": base64.b64encode(image_bytes).decode("ascii"),
            "sortType": "normal",
        }
        response = self._send_search(params)
        image_id = self._object(response.data, "data").get("data")
        image_id = self._object(image_id, "data.data").get("imageId")
        if not isinstance(image_id, str) or not image_id:
            raise MtopError("图片搜索上传响应缺少 imageId")
        return image_id

    def search_by_id(self, query: ImageIdSearchQuery) -> MtopResponse[JsonValue]:
        """使用已有 imageId 查询相似商品。"""
        params = {
            "method": "imageOfferSearchService",
            "beginPage": query.page,
            "pageSize": query.page_size,
            "imageId": query.image_id,
            "searchScene": "pcImageSearch",
            "appName": "pctusou",
        }
        return self._send_search(params)

    def search_by_url(self, query: ImageSearchQuery) -> MtopResponse[JsonValue]:
        """根据远程图片 URL 直接查询相似商品。"""
        params = {
            "method": "imageSimilarSearchV2",
            "beginPage": query.page,
            "pageSize": query.page_size,
            "imageAddress": query.image_address,
            "searchScene": "pcImageSearch",
            "appName": "pctusou",
        }
        return self._send_search(params)

    def search(self, image_source: str, page: int = 1, page_size: int = 60) -> MtopResponse[JsonValue]:
        """远程 URL 直接搜索；本地文件先上传，再使用 imageId 搜索。"""
        parsed_url = urlsplit(image_source)
        if parsed_url.scheme in {"http", "https"} and parsed_url.netloc:
            return self.search_by_url(
                ImageSearchQuery(image_address=image_source, page=page, page_size=page_size)
            )
        image_id = self.upload(image_source)
        return self.search_by_id(ImageIdSearchQuery(image_id=image_id, page=page, page_size=page_size))

    def _send_search(self, params: dict[str, JsonValue]) -> MtopResponse[JsonValue]:
        """使用统一的搜索 MTOP 接口发送具体搜索操作。"""
        request = MtopRequest(
            api=SEARCH_API,
            version="2.0",
            method="POST",
            data={
                "appId": 32517,
                "params": json.dumps(params, ensure_ascii=False, separators=(",", ":")),
            },
        )
        return self._transport.request(request)

    def _read_image(self, source: str) -> bytes:
        """从 HTTPS/HTTP URL 或本地文件读取图片。"""
        parsed_url = urlsplit(source)
        if parsed_url.scheme in {"http", "https"} and parsed_url.netloc:
            response = self._http.get(source)
            response.raise_for_status()
            return response.content
        return Path(source).read_bytes()

    @staticmethod
    def _object(value: JsonValue | None, field_name: str) -> JsonObject:
        """确保上传响应的指定节点是 JSON 对象。"""
        match value:
            case dict(result):
                return result
            case str() | int() | float() | bool() | list() | None:
                raise MtopError(f"图片搜索响应中的 {field_name} 不是对象")
            case unreachable:
                from typing import assert_never

                assert_never(unreachable)
