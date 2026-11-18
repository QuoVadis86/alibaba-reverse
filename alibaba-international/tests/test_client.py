import json

import httpx2
import pytest

from alibaba_international import (
    AlibabaApiError,
    AlibabaInternationalClient,
    ChallengeRequiredError,
    UnexpectedResponseError,
    parse_detail_html,
)


def test_parse_detail_html_preserves_nested_product_data() -> None:
    payload = {
        "globalData": {
            "product": {
                "productId": 123,
                "subject": "Example",
                "sku": {"skuAttrs": [{"name": "Color", "values": ["Blue"]}]},
            },
            "seller": {"companyName": "Seller"},
        }
    }
    detail = parse_detail_html(f"<script>window.detailData = {json.dumps(payload)};</script>")
    assert detail.globalData.product.productId == 123
    assert detail.globalData.product.sku == payload["globalData"]["product"]["sku"]
    assert detail.globalData.seller == {"companyName": "Seller"}


def test_parse_detail_html_rejects_challenge_and_invalid_data() -> None:
    with pytest.raises(ChallengeRequiredError):
        parse_detail_html("<html>login_jump</html>")
    with pytest.raises(UnexpectedResponseError):
        parse_detail_html("<script>window.detailData = {broken};</script>")


def test_client_uses_search_product_url_and_handles_api_failures() -> None:
    detail_html = (
        '<script>window.detailData = '
        '{"globalData":{"product":{"productId":123,"subject":"Example"}}};</script>'
    )

    def handler(request: httpx2.Request) -> httpx2.Response:
        if request.url.path == "/search/api/proTextSearch":
            return httpx2.Response(
                200,
                json={
                    "success": True,
                    "model": {
                        "offers": [
                            {
                                "productId": 123,
                                "productUrl": "//www.alibaba.com/product-detail/Example_123.html",
                                "title": "Example",
                            }
                        ]
                    },
                },
            )
        if request.url.path == "/product-detail/Example_123.html":
            return httpx2.Response(200, text=detail_html)
        return httpx2.Response(200, json={"success": False, "code": 401, "msg": "login"})

    with (
        httpx2.Client(transport=httpx2.MockTransport(handler)) as http,
        AlibabaInternationalClient(http) as sdk,
    ):
        result = sdk.search("example")
        detail = sdk.get_detail(result.model.offers[0].productUrl)
        assert detail.globalData.product.subject == "Example"
        with pytest.raises(AlibabaApiError, match="401"):
            sdk.get_description(123)


def test_detail_url_rejects_other_hosts() -> None:
    with AlibabaInternationalClient() as sdk, pytest.raises(ValueError):
        sdk.get_detail("https://other.example/product-detail/Example_123.html")


def test_briefs_send_observed_referer_and_release_uses_is_success() -> None:
    def handler(request: httpx2.Request) -> httpx2.Response:
        if request.url.path.endswith("productsbrief.htm"):
            assert request.headers["referer"].endswith("descIframe.html?productId=123")
            assert request.url.params["ids"] == "123,456"
            return httpx2.Response(200, json={"isSuccess": True, "data": [{"id": 123}]})
        return httpx2.Response(
            200, json={"success": False, "isSuccess": True, "top": {"pcHtmlContent": "<div/>"}}
        )

    with (
        httpx2.Client(transport=httpx2.MockTransport(handler)) as http,
        AlibabaInternationalClient(http) as sdk,
    ):
        assert len(sdk.get_product_briefs([123, 456], product_id=123).data) == 1
        assert sdk.get_release_content(123).top == {"pcHtmlContent": "<div/>"}
