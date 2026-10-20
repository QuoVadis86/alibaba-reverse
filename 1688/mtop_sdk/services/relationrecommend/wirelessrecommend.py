"""`mtop.relationrecommend.WirelessRecommend.recommend` 的搜索方法。"""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Final, assert_never
from urllib.parse import urlsplit

import httpx2

from mtop_sdk.exceptions import MtopError
from mtop_sdk.models.common import JsonObject, JsonValue, MtopResponse
from mtop_sdk.models.search import (
    ImageIdSearchQuery,
    ImageSearchQuery,
    SearchConfigQuery,
    TextSearchQuery,
)
from mtop_sdk.transport import MtopRequest, MtopTransport

API: Final = "mtop.relationrecommend.WirelessRecommend.recommend"


class WirelessRecommendService:
    """关键词、搜索筛选配置和以图搜图接口。"""

    def __init__(self, transport: MtopTransport, http: httpx2.Client) -> None:
        self._transport = transport
        self._http = http

    def search_text(self, query: TextSearchQuery) -> MtopResponse[JsonValue]:
        """按关键词查询商品。"""
        return self._search(
            {
                "method": "getOfferList",
                "beginPage": query.page,
                "pageSize": query.page_size,
                "keywords": query.keywords,
                "searchScene": "pcOfferSearch",
                "verticalProductFlag": "pcmarket",
                "charset": "GBK",
                "sortType": query.sort_type,
            }
        )

    def get_config(self, query: SearchConfigQuery) -> MtopResponse[JsonValue]:
        """查询搜索页类目导航和筛选项。"""
        return self._search(
            {
                "method": "batchGetNavigationAndConfigData",
                "keywords": query.keywords,
                "searchScene": "pcOfferSearch",
                "verticalProductFlag": "pcmarket",
                "charset": "GBK",
            }
        )

    def upload_image(self, image_source: str) -> str:
        """上传本地图片或远程图片并返回 imageId。"""
        image_data = self._read_image(image_source)
        response = self._search(
            {
                "method": "uploadBase64WithRequest",
                "beginPage": 1,
                "pageSize": 60,
                "searchScene": "pcImageSearch",
                "appName": "pctusou",
                "imageBase64": base64.b64encode(image_data).decode("ascii"),
                "sortType": "normal",
            }
        )
        payload = self._object(response.data, "data")
        nested = self._object(payload.get("data"), "data.data")
        image_id = nested.get("imageId")
        if not isinstance(image_id, str) or not image_id:
            raise MtopError("图片搜索上传响应缺少 imageId")
        return image_id

    def search_by_image_id(self, query: ImageIdSearchQuery) -> MtopResponse[JsonValue]:
        """使用已有 imageId 查询相似商品。"""
        return self._search(
            {
                "method": "imageOfferSearchService",
                "beginPage": query.page,
                "pageSize": query.page_size,
                "imageId": query.image_id,
                "searchScene": "pcImageSearch",
                "appName": "pctusou",
            }
        )

    def search_by_image_url(self, query: ImageSearchQuery) -> MtopResponse[JsonValue]:
        """使用远程图片 URL 查询相似商品。"""
        return self._search(
            {
                "method": "imageSimilarSearchV2",
                "beginPage": query.page,
                "pageSize": query.page_size,
                "imageAddress": query.image_address,
                "searchScene": "pcImageSearch",
                "appName": "pctusou",
            }
        )

    def search_by_image(
        self,
        image_source: str,
        page: int = 1,
        page_size: int = 60,
    ) -> MtopResponse[JsonValue]:
        """远程图片直接搜索；本地文件先上传再按 imageId 搜索。"""
        parsed = urlsplit(image_source)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            return self.search_by_image_url(
                ImageSearchQuery(image_address=image_source, page=page, page_size=page_size)
            )
        image_id = self.upload_image(image_source)
        return self.search_by_image_id(
            ImageIdSearchQuery(image_id=image_id, page=page, page_size=page_size)
        )

    def _search(self, params: JsonObject) -> MtopResponse[JsonValue]:
        """调用统一搜索 API，params 字符串为接口要求的 JSON。"""
        return self._transport.request(
            MtopRequest(
                api=API,
                version="2.0",
                method="POST",
                data={
                    "appId": 32517,
                    "params": json.dumps(params, ensure_ascii=False, separators=(",", ":")),
                },
            )
        )

    def _read_image(self, source: str) -> bytes:
        """从 HTTP(S) URL 或本地路径读取待上传图片。"""
        parsed = urlsplit(source)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            response = self._http.get(source)
            response.raise_for_status()
            return response.content
        return Path(source).read_bytes()

    @staticmethod
    def _object(value: JsonValue | None, field_name: str) -> JsonObject:
        """校验图片上传响应的对象节点。"""
        match value:
            case dict(result):
                return result
            case str() | int() | float() | bool() | list() | None:
                raise MtopError(f"图片搜索响应中的 {field_name} 不是对象")
            case unreachable:
                assert_never(unreachable)
