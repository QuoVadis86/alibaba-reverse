# 1688

本目录整理 1688 接口分析资料。目前包含 MTOP 请求签名算法，以及查询单个商品 SKU 的接口客户端。

## 目录

- [`docs/`](docs/)：算法说明和分析记录。
- [`tools/`](tools/)：可复用的本地分析工具。
- [`samples/`](samples/)：存放经过脱敏和审查的最小样例；目前没有原始流量样本。

## 当前内容

- [MTOP 签名算法](docs/mtop-signature.md)
- [签名计算模块](tools/mtop_sign.py)
- [MTOP 接口客户端](tools/mtop_client.py)

## 调用 SKU 接口

需要安装 [uv](https://docs.astral.sh/uv/)，并先在当前终端的 `MTOP_COOKIE` 环境变量中设置已获授权的 1688 浏览器 Cookie，再运行：

```bash
export MTOP_COOKIE
uv run 1688/tools/mtop_client.py 566344866833
```

脚本从 Cookie 中读取 `_m_h5_tk` 令牌，签名后请求一个商品的 SKU 信息，并输出 JSON。Cookie 只从环境变量读取，不要把它写进仓库或命令历史。当前实现一次请求一个商品，不做批量请求、不处理验证码，也不会打印 Cookie 或令牌。

已安装脚本依赖的 Python 项目也可以导入客户端；把 `1688/tools/` 加入 `PYTHONPATH` 后：

```python
import os

from mtop_client import MtopClient, create_http_client

with create_http_client() as http:
    response = MtopClient(http, os.environ["MTOP_COOKIE"]).get_offer_sku("566344866833")
```
