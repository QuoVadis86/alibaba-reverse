from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Literal
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import MtopClient, create_http_client
from services.search.results import (
    CompanySearchQuery,
)


LinkType = Literal["captcha", "captchacapslidev2"]
ACTIONS = ("captcha", "captchacapslidev2")
QUERY = CompanySearchQuery(
    keywords="减肥神器",
    page_id="UlrAiaLWrhDByMKwcdSus7G5iuiIqIWy5YUs11WEnsuCSI19",
)
OUTPUT_DIR = Path(__file__).resolve().parents[2] / ".playwright-cli"


def request_challenge() -> dict[str, Any]:
    with create_http_client() as http:
        http.headers["User-Agent"] = "python"
        response = MtopClient(http).search.results.get_company_list(QUERY)
        data = response.data
        url = data.get("url") if isinstance(data, dict) else None
        action = ""
        if isinstance(url, str):
            parsed = urlsplit(url)
            if parsed.path.endswith("/_____tmd_____/punish"):
                action = parse_qs(parsed.query).get("action", [""])[0]
        return {
            "action": action,
            "url": url if action in ACTIONS else None,
            "cookies": [
                {
                    "name": cookie.name,
                    "value": cookie.value,
                    "domain": cookie.domain,
                    "path": cookie.path,
                }
                for cookie in http.cookies
            ] if action in ACTIONS else [],
        }


def get_challenge(link_type: LinkType) -> dict[str, Any]:
    if link_type not in ACTIONS:
        raise ValueError(f"未知的挑战类型: {link_type}")
    for _ in range(5):
        with ThreadPoolExecutor(max_workers=24) as pool:
            futures = [pool.submit(request_challenge) for _ in range(36)]
            for future in as_completed(futures):
                try:
                    result = future.result()
                except Exception:
                    continue
                if result["action"] == link_type:
                    return result
    raise RuntimeError(f"连续 180 次请求均未取得 {link_type} 挑战")


def main() -> int:
    parser = argparse.ArgumentParser(description="并发获取不同类型的验证挑战链接")
    parser.add_argument("link_type", choices=ACTIONS)
    arguments = parser.parse_args()
    result = get_challenge(arguments.link_type)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"challenge_{arguments.link_type}.json"
    descriptor = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as output:
        json.dump(result, output, ensure_ascii=False, indent=2)
        output.write("\n")
    output_path.chmod(0o600)
    print(json.dumps({"action": result["action"], "url": result["url"],
                      "output": str(output_path)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
