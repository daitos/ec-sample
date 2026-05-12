"""
エントリーポイント

Chatbot_Serviceを起動するメインモジュール。
.envファイルから環境変数を読み込み、Agentを初期化してFastAPIサーバーを起動する。
"""

import logging
import os
import sys

from dotenv import load_dotenv
import uvicorn

from app.agent import create_agent
from app.server import set_agent

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    # .envファイルを読み込む
    load_dotenv()

    # Agentを初期化
    try:
        agent = create_agent()
        set_agent(agent)
    except EnvironmentError as e:
        logger.error("Agent初期化エラー: %s", str(e))
        sys.exit(1)

    # ポート設定
    port = int(os.environ.get("CHATBOT_PORT", "8000"))

    # FastAPIサーバーを起動
    logger.info("Chatbot_Serviceをポート %d で起動します", port)
    uvicorn.run("app.server:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    main()
