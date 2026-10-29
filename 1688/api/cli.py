"""SDK 命令行入口。"""

from __future__ import annotations

import json

import requests
import typer

from api import MtopClient, create_http_client
from api.exceptions import MtopError


def main(
    offer_id: str,
    cookie: str | None = typer.Option(None, envvar="MTOP_COOKIE", hide_input=True),
) -> None:
    """查询单个商品 SKU，并输出统一响应 JSON。"""
    try:
        if not offer_id.isdecimal():
            raise MtopError("商品 ID 必须是数字")
        with create_http_client() as http:
            result = MtopClient(http, cookie).product.sku.get(offer_id)
    except (requests.RequestException, MtopError) as error:
        typer.echo(f"查询失败：{error}", err=True)
        raise typer.Exit(code=1) from error

    print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))


def run() -> None:
    """启动 Typer 命令行。"""
    typer.run(main)
