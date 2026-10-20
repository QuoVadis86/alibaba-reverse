# 1688

本目录整理 1688 接口分析资料，并提供可安装、可导入的 MTOP Python SDK。目前包含签名算法，以及商品 SKU、详情 AB 配置和物流时效接口。

## 目录

- [`mtop_sdk/`](mtop_sdk/)：SDK 源码。传输、签名、模型和异常处理放在包根目录，业务接口按服务和接口拆分。
- [`docs/`](docs/)：算法说明和分析记录。
- [`samples/`](samples/)：存放经过脱敏和审查的最小样例；目前没有原始流量样本。
- [`pyproject.toml`](pyproject.toml)：Python 项目元数据、依赖、打包配置和 CLI 入口。

## 安装和命令行

需要安装 [uv](https://docs.astral.sh/uv/)。在仓库根目录运行：

```bash
uv run --project 1688 mtop-1688 566344866833
```

没有已有 Cookie 时，客户端会先使用 `undefined` 参与签名发起匿名引导请求，再从响应的 `Set-Cookie` 头读取 `_m_h5_tk`，然后请求 SKU 信息。也可以通过 `MTOP_COOKIE` 提供已授权的浏览器 Cookie；不要把 Cookie 写入仓库或命令历史。当前实现一次请求一个商品，不做批量请求、不处理验证码，也不会打印 Cookie 或令牌。

## Python SDK

在其他 Python 项目中安装本地 SDK：

```bash
python -m pip install -e ./1688
```

然后调用对应服务方法：

```python
from mtop_sdk import MtopClient, create_http_client

with create_http_client() as http:
    result = MtopClient(http).offer.sku.get("566344866833")
    sku_data = result.data
```

所有接口方法返回统一的 `MtopResponse`，可通过 `result.success`、`result.ret` 和 `result.data` 读取状态及业务数据；完整原始响应可从 `result.raw` 获取。

## 接口和代码组织

服务按业务域组织，具体接口各占独立模块，新增接口时无需继续扩展一个大文件：

```text
mtop_sdk/
├── client.py                 # SDK 客户端门面
├── transport.py              # MTOP 请求、响应和 token 引导
├── sign.py                   # 签名算法
├── models.py                 # 入参和统一响应模型
├── exceptions.py             # SDK 异常
├── cli.py                    # 命令行实现
└── services/
    └── offer/
        ├── sku.py            # 商品 SKU
        └── detail/
            ├── common.py     # 详情接口共用配置
            ├── config.py     # 详情 AB 配置接口
            └── logistics.py  # 物流时效接口
```

当前调用方法：

- `client.offer.sku.get(offer_id)`
- `client.offer.detail.get_config(ab_test_key)`
- `client.offer.detail.get_logistics(query)`

物流入参使用 `OfferLogisticsQuery` 模型，字段应填写获授权详情页请求中的真实值。商品标题、图片和描述目前来自详情页 SSR 数据，尚未封装。
