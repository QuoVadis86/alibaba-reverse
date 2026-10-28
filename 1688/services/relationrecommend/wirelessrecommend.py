"""`mtop.relationrecommend.WirelessRecommend.recommend` 的搜索方法。"""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import assert_never
from urllib.parse import quote_from_bytes, urlsplit

import requests
from pydantic import BaseModel, ConfigDict, Field, PositiveInt

from api.exceptions import MtopError
from api.response import JsonObject, JsonValue, MtopResponse
from api.transport import MtopRequest, MtopTransport
from services.relationrecommend._captured import (
    API,
    HotKeywordsQuery,
    InputHotKeywordsQuery,
    call_captured,
    hot_keywords,
    input_hot_keywords,
)


class TextSearchQuery(BaseModel):
    """商品关键词搜索条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    keywords: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 60
    sort_type: str = "normal"


class SearchConfigQuery(BaseModel):
    """搜索页筛选和类目配置查询条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    keywords: str = Field(min_length=1)


class CompanySearchQuery(BaseModel):
    """企业搜索条件；page_id 从企业搜索页面初始化数据中读取。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    keywords: str = Field(min_length=1)
    page_id: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 20
    spm: str = "a26352.24780423.searchbox.0"
    session_id: str = ""


class ImageSearchQuery(BaseModel):
    """基于远程图片地址的相似商品搜索条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    image_address: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 60


class ImageIdSearchQuery(BaseModel):
    """基于已上传图片 ID 的商品搜索条件。"""

    model_config = ConfigDict(frozen=True, extra="forbid")

    image_id: str = Field(min_length=1)
    page: PositiveInt = 1
    page_size: PositiveInt = 60


class WirelessRecommendService:
    """提供商品搜索、企业搜索、搜索筛选配置和以图搜图接口。"""

    def __init__(self, transport: MtopTransport, http: requests.Session) -> None:
        self._transport = transport
        self._http = http

    def get_hot_keywords(
        self, query: HotKeywordsQuery | None = None
    ) -> MtopResponse[JsonValue]:
        """获取 PC 搜索框展示的热词。"""
        return hot_keywords(self._transport, query or HotKeywordsQuery())

    def get_input_hot_keywords(
        self, query: InputHotKeywordsQuery | None = None
    ) -> MtopResponse[JsonValue]:
        """获取搜索框输入时展示的热词。"""
        return input_hot_keywords(self._transport, query or InputHotKeywordsQuery())

    def get_home_experiments(self) -> MtopResponse[JsonValue]:
        """获取首页找工厂推荐区的实验配置。"""
        return call_captured(
            self._transport,
            31250,
            {
                "scene_id": 1,
                "pageName": "findFactory",
                "level1_biz": "recommend",
                "level2_biz": "homeguess",
                "level3_biz": "pc_main",
            },
        )

    def get_initial_data(self) -> MtopResponse[JsonValue]:
        """获取 PC 商品搜索页的初始配置。"""
        return call_captured(
            self._transport,
            32517,
            {
                "appName": "nodeSearchWork",
                "method": "getInitialData",
                "verticalProductFlag": "pcmarket",
                "searchScene": "pcOfferSearch",
                "charset": "GBK",
            },
        )

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

    def get_company_list(self, query: CompanySearchQuery) -> MtopResponse[JsonValue]:
        """按关键词查询 1688 企业/工厂列表及其分页结果。"""
        encoded_keywords = quote_from_bytes(query.keywords.encode("gbk"))
        params = {
            "beginPage": query.page,
            "pageSize": query.page_size,
            "method": "getCompanyList",
            "pageId": query.page_id,
            "verticalProductFlag": "pcfactory",
            "searchScene": "pcCompanySearch",
            "charset": "GBK",
            "spm": query.spm,
            "keywords": encoded_keywords,
            "sessionId": query.session_id,
        }
        return self._transport.request(
            MtopRequest(
                api=API,
                version="2.0",
                method="GET",
                data={
                    "appId": 32517,
                    "params": json.dumps(params, ensure_ascii=False, separators=(",", ":")),
                },
                extra_params={
                    "jsv": "2.7.2",
                    "jsonpIncPrefix": "reqTppId_32517_getCompanyList",
                    "callback": "mtopjsonpreqTppId_32517_getCompanyList1",
                },
            )
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
            response = self._http.get(source, timeout=(5.0, 30.0))
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
