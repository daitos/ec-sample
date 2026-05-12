import os
import json
import requests
from strands import tool

BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:5000")


def _call_backend(method: str, path: str, **kwargs) -> dict:
    """バックエンドAPIを呼び出す共通関数"""
    url = f"{BACKEND_API_URL}{path}"
    try:
        response = requests.request(method, url, timeout=10, **kwargs)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        return {"error": "バックエンドサービスに接続できません"}
    except requests.exceptions.Timeout:
        return {"error": "バックエンドサービスがタイムアウトしました"}
    except requests.exceptions.HTTPError as e:
        return {"error": f"APIエラー: {e.response.status_code}"}
    except Exception as e:
        return {"error": f"予期しないエラー: {str(e)}"}


@tool
def get_products() -> str:
    """
    eコマースストアの全商品一覧を取得します。
    商品の検索や推薦に使用してください。

    Returns:
        str: 商品一覧のJSON文字列
             各商品: {id, name, category, price, description, emoji}
             エラー時: {"error": "エラーメッセージ"}
    """
    result = _call_backend("GET", "/api/products")
    return json.dumps(result, ensure_ascii=False)


@tool
def get_product_detail(product_id: int) -> str:
    """
    指定した商品IDの詳細情報を取得します。
    商品の詳細説明、価格、レビューを確認する際に使用してください。

    Args:
        product_id: 商品ID（整数）

    Returns:
        str: 商品詳細のJSON文字列
             {id, name, category, price, description, emoji, reviews: [...]}
             エラー時: {"error": "エラーメッセージ"}
    """
    result = _call_backend("GET", f"/api/products/{product_id}")
    return json.dumps(result, ensure_ascii=False)
