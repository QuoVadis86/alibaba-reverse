from pydantic import BaseModel, ConfigDict, Field, JsonValue


class ObservedModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)


class SearchOffer(ObservedModel):
    productId: int | str
    productUrl: str
    title: str
    price: str | None = None
    moq: str | None = None
    companyName: str | None = None


class SearchModel(ObservedModel):
    offers: list[SearchOffer]
    paginationData: dict[str, JsonValue] | None = None


class SearchResponse(ObservedModel):
    success: bool
    model: SearchModel


class DetailProduct(ObservedModel):
    productId: int | str
    subject: str
    mediaItems: JsonValue | None = None
    price: JsonValue | None = None
    moq: JsonValue | None = None
    sku: JsonValue | None = None


class DetailGlobalData(ObservedModel):
    product: DetailProduct
    seller: dict[str, JsonValue] | None = None
    inventory: dict[str, JsonValue] | None = None
    trade: dict[str, JsonValue] | None = None
    review: dict[str, JsonValue] | None = None


class DetailData(ObservedModel):
    globalData: DetailGlobalData


class DescriptionData(ObservedModel):
    productHtmlDescription: str
    productDescriptionType: JsonValue | None = None
    productDescriptionPcPageId: JsonValue | None = None


class DescriptionResponse(ObservedModel):
    success: bool
    data: DescriptionData


class RecommendationData(ObservedModel):
    floors: list[dict[str, JsonValue]]


class RecommendationResponse(ObservedModel):
    success: bool
    code: int | None = None
    data: RecommendationData


class LogisticsRequest(ObservedModel):
    productId: int
    quantity: int = Field(gt=0)
    shipToCountry: str
    currencyCode: str
    dispatchCountry: str | None = None
    language: str = "en_US"
    timeZone: str = "UTC"
    shipToZipCode: str = ""
    packageMode: str = "piece"
    orderSource: str = "buyNow"
    type: str = "product"
    productTotalPrice: float | None = None
    skuQuantity: str | None = None
    skuQuantityExpress: dict[str, int] | None = None
    forceNoSemiManaged: bool | None = None
    extendParam: dict[str, JsonValue] | None = None


class LogisticsResponse(ObservedModel):
    success: bool
    code: int | None = None
    data: dict[str, JsonValue] | None = None


class ProductBriefResponse(ObservedModel):
    isSuccess: bool
    data: list[dict[str, JsonValue]]


class ReleaseContentResponse(ObservedModel):
    isSuccess: bool
    top: dict[str, JsonValue] | None = None
