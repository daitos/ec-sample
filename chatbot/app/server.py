"""
FastAPIサーバーモジュール

チャットボットサービスのHTTPエンドポイントを定義する。
"""

import logging
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import run_agent
from .session import SessionManager

logger = logging.getLogger(__name__)

# FastAPIアプリケーションの初期化
app = FastAPI(
    title="Shopping Assistant Chatbot",
    description="ショッピングアシスタントチャットボットAPI",
    version="1.0.0",
)

# CORS設定
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# モジュールレベルのSessionManagerインスタンス
session_manager = SessionManager()

# モジュールレベルのAgentインスタンス（main.pyからset_agentで設定される）
agent = None


def set_agent(a) -> None:
    """
    モジュールレベルのAgentインスタンスを設定する。
    main.pyからcreate_agent()で生成したAgentを渡す。

    Args:
        a: 初期化済みのStrands Agent
    """
    global agent
    agent = a
    logger.info("Agentインスタンスが設定されました")


# Pydanticモデル定義

class ChatRequest(BaseModel):
    message: str                  # ユーザーメッセージ（必須）
    session_id: Optional[str] = None  # セッションID（省略時は新規生成）


class ChatResponse(BaseModel):
    response: str   # アシスタント応答テキスト
    session_id: str  # セッションID（新規生成時も返却）


class HealthResponse(BaseModel):
    status: str   # "ok"
    service: str  # "shopping-assistant-chatbot"
    version: str  # "1.0.0"


# エンドポイント定義

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    チャットメッセージを処理し、アシスタントの応答を返す。

    Args:
        request: ChatRequest（message, session_id）

    Returns:
        ChatResponse（response, session_id）

    Raises:
        HTTPException 400: messageフィールドが空の場合
        HTTPException 500: Agent処理中にエラーが発生した場合
    """
    # messageフィールドの検証（空文字列チェック）
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="messageフィールドは必須です",
        )

    # セッションの取得または新規作成
    session_id, conversation_history = session_manager.get_or_create_session(
        request.session_id
    )

    # Agentを呼び出してレスポンスを生成
    try:
        response_text = run_agent(agent, request.message, conversation_history)
    except Exception as e:
        logger.error("Agent処理中にエラーが発生しました: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"内部サーバーエラー: {str(e)}",
        ) from e

    # 会話履歴を更新
    session_manager.update_session(session_id, request.message, response_text)

    return ChatResponse(response=response_text, session_id=session_id)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """
    サービスのヘルスチェックエンドポイント。

    Returns:
        HealthResponse（status, service, version）
    """
    return HealthResponse(
        status="ok",
        service="shopping-assistant-chatbot",
        version="1.0.0",
    )
