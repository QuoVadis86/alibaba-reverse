import json
import re
from typing import Self, TypeVar
from urllib.parse import urljoin, urlsplit

import httpx2
from pydantic import BaseModel, JsonValue, TypeAdapter, ValidationError

from .errors import AlibabaApiError, ChallengeRequiredError, UnexpectedResponseError
from .models import (
    DescriptionResponse,
    DetailData,
    LogisticsRequest,
    LogisticsResponse,
    ProductBriefResponse,
    RecommendationResponse,
    ReleaseContentResponse,
    SearchResponse,
)

_DETAIL_ASSIGNMENT = re.compile(r"\bwindow\.detailData\s*=\s*")
_BASE_URL = "https://www.alibaba.com"
_JSON_OBJECT = TypeAdapter(dict[str, JsonValue])
ModelT = TypeVar("ModelT", bound=BaseModel)


def parse_detail_html(html: str) -> DetailData:
    """Extract the JSON assigned to window.detailData without evaluating page JavaScript."""
    match = _DETAIL_ASSIGNMENT.search(html)
    if match is None:
        if "login_jump" in html or "baxia" in html.lower() or "challenge" in html.lower():
            raise ChallengeRequiredError("Alibaba returned a login or verification page")
        raise UnexpectedResponseError("window.detailData was absent from the detail HTML")
    try:
        payload, _ = json.JSONDecoder().raw_decode(html, match.end())
        return DetailData.model_validate(payload)
    except (ValueError, ValidationError) as exc:
        raise UnexpectedResponseError("window.detailData was not valid detail JSON") from exc


class AlibabaInternationalClient:
    def __init__(self, client: httpx2.Client | None = None) -> None:
        self._owns_client = client is None
        self._client = client or httpx2.Client(
            base_url=_BASE_URL,
            http2=True,
            follow_redirects=True,
            timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (compatible; AlibabaInternationalSDK/0.1)"},
        )

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def _get_model(
        self,
        path: str,
        params: dict[str, str | int],
        model_type: type[ModelT],
        success_field: str,
        headers: dict[str, str] | None = None,
    ) -> ModelT:
        response = self._client.get(urljoin(_BASE_URL, path), params=params, headers=headers)
        response.raise_for_status()
        return self._parse_json_response(response, model_type, success_field)

    @staticmethod
    def _parse_json_response(
        response: httpx2.Response, model_type: type[ModelT], success_field: str
    ) -> ModelT:
        try:
            payload = response.json()
        except ValueError as exc:
            raise UnexpectedResponseError("Alibaba returned a non-JSON response") from exc
        if not isinstance(payload, dict):
            raise UnexpectedResponseError("Alibaba returned a non-object JSON response")
        if payload.get(success_field) is not True:
            raise AlibabaApiError(
                f"Alibaba API rejected the request: code={payload.get('code')}, "
                f"message={payload.get('msg') or payload.get('message') or payload.get('msgInfo')}"
            )
        try:
            return model_type.model_validate(payload)
        except ValidationError as exc:
            raise UnexpectedResponseError("Alibaba changed the observed JSON structure") from exc

    def search(self, query: str, *, page: int = 1, page_size: int = 20) -> SearchResponse:
        if not query.strip() or page < 1 or not 1 <= page_size <= 60:
            raise ValueError("query must be nonempty, page >= 1, and page_size between 1 and 60")
        return self._get_model(
            "/search/api/proTextSearch",
            {"query": query, "page": page, "pageSize": page_size},
            SearchResponse,
            "success",
        )

    def get_detail(self, product_url: str) -> DetailData:
        url = urljoin(f"{_BASE_URL}/", product_url)
        parts = urlsplit(url)
        if parts.scheme != "https" or parts.netloc != "www.alibaba.com" or not parts.path.startswith(
            "/product-detail/"
        ):
            raise ValueError("product_url must be an https://www.alibaba.com/product-detail/ URL")
        response = self._client.get(url)
        response.raise_for_status()
        return parse_detail_html(response.text)

    def get_description(self, product_id: int, *, language: str = "en") -> DescriptionResponse:
        return self._get_model(
            "/event/app/mainAction/desc.htm",
            {"detailId": product_id, "language": language},
            DescriptionResponse,
            "success",
        )

    def get_recommendations(self, product_id: int) -> RecommendationResponse:
        return self._get_model(
            "/event/app/detailRecommendProducts/allRecommendationList",
            {"productId": product_id},
            RecommendationResponse,
            "success",
        )

    def estimate_logistics(self, request: LogisticsRequest) -> LogisticsResponse:
        response = self._client.post(
            f"{_BASE_URL}/event/app/productDetail/logistics.do",
            json=request.model_dump(exclude_none=True),
        )
        response.raise_for_status()
        return self._parse_json_response(response, LogisticsResponse, "success")

    def get_product_briefs(
        self, ids: list[int], *, product_id: int, language: str = "en"
    ) -> ProductBriefResponse:
        if not ids:
            raise ValueError("ids must contain at least one product ID")
        return self._get_model(
            "/event/app/productsBrief/productsbrief.htm",
            {
                "ids": ",".join(map(str, ids)),
                "language": language,
                "productId": product_id,
                "detailId": product_id,
            },
            ProductBriefResponse,
            "isSuccess",
            headers={
                "Referer": (
                    f"{_BASE_URL}/product-detail/description/descIframe.html"
                    f"?productId={product_id}"
                )
            },
        )

    def get_release_content(self, product_id: int) -> ReleaseContentResponse:
        return self._get_model(
            "/event/app/productQuickDetail/releaseContent.htm",
            {"productId": product_id, "terminalType": "pc", "detailId": product_id},
            ReleaseContentResponse,
            "isSuccess",
        )

    def _get_json_object(
        self, url: str, params: dict[str, str] | None = None
    ) -> dict[str, JsonValue]:
        response = self._client.get(url, params=params)
        response.raise_for_status()
        try:
            return _JSON_OBJECT.validate_python(response.json())
        except (ValueError, ValidationError) as exc:
            raise UnexpectedResponseError("Alibaba returned an unexpected JSON response") from exc

    def get_navigation(self) -> dict[str, JsonValue]:
        return self._get_json_object("https://s.alicdn.com/@xconfig/header/subHeaderConfig")

    def get_payment_logos(
        self, *, buyer_country_code: str = "CN", scene: str = "the-new-footer"
    ) -> dict[str, JsonValue]:
        data = self._get_json_object(
            "https://cashier.alibaba.com/payment/ajaxQueryLocalizedLogo.json",
            {
                "types": "SECURITY,PAYMENT",
                "scene": scene,
                "buyerCountryCode": buyer_country_code,
                "deviceType": "PC",
            },
        )
        if data.get("succeed") is not True:
            raise AlibabaApiError(f"Payment logo request failed: code={data.get('code')}")
        return data

    def get_ship_to_recommendation(
        self, *, scene: str, exposure_method: str
    ) -> dict[str, JsonValue]:
        data = self._get_json_object(
            "https://biz.alibaba.com/lt-address/shipto/recommendShipTo",
            {"json": json.dumps({"scene": scene, "exposureMethod": exposure_method})},
        )
        self._require_code_200(data)
        return data

    def get_tax_header_entry(self, *, token: str | None = None) -> dict[str, JsonValue]:
        params = {"_tb_token_": token} if token else None
        data = self._get_json_object(
            "https://biz.alibaba.com/contract/ajax/ajaxTaxHeaderEntrance.json", params
        )
        self._require_code_200(data)
        return data

    def get_favorite_component_config(self, *, model_id: int = 12717) -> dict[str, JsonValue]:
        data = self._get_json_object(
            "https://insights.alibaba.com/openservice/gatewayService",
            {"modelId": str(model_id)},
        )
        self._require_code_200(data)
        return data

    @staticmethod
    def _require_code_200(data: dict[str, JsonValue]) -> None:
        if str(data.get("code")) != "200":
            raise AlibabaApiError(f"Alibaba API rejected the request: code={data.get('code')}")
