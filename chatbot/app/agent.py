import logging
import os

from strands import Agent
from strands.models import BedrockModel

from .tools.cart_tools import add_to_cart, get_cart, remove_from_cart
from .tools.product_tools import get_product_detail, get_products

logger = logging.getLogger(__name__)

MODEL_ID = "amazon.nova-pro-v1:0"
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

SYSTEM_PROMPT = """あなたはeコマースストアのショッピングアシスタントです。
日本語で丁寧かつ自然な会話を行い、お客様のショッピングをサポートします。

あなたの役割:
- 商品の検索・推薦（カテゴリ、価格帯、用途に基づく）
- 商品の詳細情報の提供（価格、説明、レビュー）
- カートの管理（追加・確認・削除）
- ショッピングに関する質問への回答

重要なルール:
- 常に日本語で応答してください
- ショッピングと無関係なトピックには丁重に対応し、ショッピング支援に誘導してください
- カートへの追加前に、商品名と数量をユーザーに確認してください
- 商品IDが不明な場合は、まずget_productsで商品一覧を取得してください
- 金額は日本円（¥）で表示してください"""


def create_agent() -> Agent:
    """
    Strands AgentをNova Proモデルで初期化する。
    AWS認証情報を環境変数から読み込み、BedrockModelを設定する。

    Returns:
        Agent: 初期化済みのStrands Agent

    Raises:
        EnvironmentError: 必須のAWS認証情報が設定されていない場合
    """
    bearer_token = os.environ.get("AWS_BEARER_TOKEN_BEDROCK")
    access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_access_key = os.environ.get("AWS_SECRET_ACCESS_KEY")

    if bearer_token:
        # Bearer Token認証モード
        logger.info("Bearer Token認証モードでBedrockModelを初期化します")
        model = BedrockModel(
            model_id=MODEL_ID,
            region_name=AWS_REGION,
            api_key=bearer_token,
        )
    elif access_key_id and secret_access_key:
        # 通常認証モード（永続または一時認証情報）
        session_token = os.environ.get("AWS_SESSION_TOKEN")
        if session_token:
            logger.info("一時認証情報モードでBedrockModelを初期化します")
            model = BedrockModel(
                model_id=MODEL_ID,
                region_name=AWS_REGION,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                aws_session_token=session_token,
            )
        else:
            logger.info("永続認証情報モードでBedrockModelを初期化します")
            model = BedrockModel(
                model_id=MODEL_ID,
                region_name=AWS_REGION,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
            )
    else:
        logger.error(
            "必須のAWS認証情報が設定されていません。"
            "AWS_BEARER_TOKEN_BEDROCK または "
            "AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY を設定してください。"
        )
        raise EnvironmentError(
            "必須のAWS認証情報が設定されていません。"
            "AWS_BEARER_TOKEN_BEDROCK または "
            "AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY を環境変数に設定してください。"
        )

    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[get_products, get_product_detail, get_cart, add_to_cart, remove_from_cart],
    )

    logger.info("Strands Agentの初期化が完了しました")
    return agent


def run_agent(agent: Agent, message: str, conversation_history: list) -> str:
    """
    Agentにメッセージを送信し、応答テキストを返す。

    Args:
        agent: 初期化済みのStrands Agent
        message: ユーザーメッセージ
        conversation_history: 過去の会話履歴リスト

    Returns:
        str: アシスタントの応答テキスト

    Raises:
        RuntimeError: Agent実行中にエラーが発生した場合
    """
    try:
        response = agent(message)
        return str(response)
    except Exception as e:
        logger.error("Agent実行中にエラーが発生しました: %s", str(e))
        raise RuntimeError(f"Agent実行中にエラーが発生しました: {str(e)}") from e
