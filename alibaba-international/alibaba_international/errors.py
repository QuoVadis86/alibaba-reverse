class AlibabaApiError(Exception):
    """Alibaba returned an unsuccessful application response."""


class ChallengeRequiredError(AlibabaApiError):
    """The detail URL returned a login or bot challenge instead of product data."""


class UnexpectedResponseError(AlibabaApiError):
    """The response did not match the observed endpoint structure."""
