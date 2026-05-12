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
def get_cart() -> str:
    """
    現在のカート内容を取得します。
    カートの確認や合計金額の計算に使用してください。

    Returns:
        str: カートアイテム一覧のJSON文字列
             各アイテム: {id, product_id, name, price, quantity, emoji}
             エラー時: {"error": "エラーメッセージ"}
    """
    result = _call_backend("GET", "/api/cart")
    return json.dumps(result, ensure_ascii=False)


@tool
def add_to_cart(product_id: int, quantity: int) -> str:
    """
    指定した商品をカートに追加します。
    ユーザーに商品名と数量を確認してから呼び出してください。

    Args:
        product_id: 商品ID（整数）
        quantity: 追加する数量（1以上の整数）

    Returns:
        str: 操作結果のJSON文字列
             成功時: {"message": "カートに追加しました", "id": cart_item_id}
             エラー時: {"error": "エラーメッセージ"}
    """
    result = _call_backend(
        "POST", "/api/cart", json={"product_id": product_id, "quantity": quantity}
    )
    return json.dumps(result, ensure_ascii=False)


@tool
def remove_from_cart(cart_item_id: int) -> str:
    """
    指定したカートアイテムIDの商品をカートから削除します。
    削除前にget_cartでカートアイテムIDを確認してください。

    Args:
        cart_item_id: カートアイテムID（整数、商品IDではない）

    Returns:
        str: 操作結果のJSON文字列
             成功時: {"message": "カートから削除しました"}
             エラー時: {"error": "エラーメッセージ"}
    """
    result = _call_backend("DELETE", f"/api/cart/{cart_item_id}")
    return json.dumps(result, ensure_ascii=False)
