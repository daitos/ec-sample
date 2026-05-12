"""
セッション管理モジュール

OrderedDictを使用したLRUキャッシュ方式でインメモリセッションを管理する。
"""

import threading
import uuid
from collections import OrderedDict
from typing import Optional


class SessionManager:
    """
    会話セッションをインメモリで管理するクラス。
    OrderedDictを使用したLRUキャッシュ方式で最大セッション数を制限する。
    """

    def __init__(self, max_sessions: int = 100):
        """
        Args:
            max_sessions: 保持する最大セッション数（デフォルト: 100）
        """
        self._sessions: OrderedDict[str, list] = OrderedDict()
        self._lock = threading.Lock()
        self._max_sessions = max_sessions

    def get_or_create_session(self, session_id: Optional[str]) -> tuple[str, list]:
        """
        セッションIDに対応する会話履歴を取得する。
        session_idがNoneまたは存在しない場合は新規セッションを作成する。

        Args:
            session_id: セッションID（省略可）

        Returns:
            tuple[str, list]: (session_id, conversation_history)
        """
        with self._lock:
            if session_id is not None and session_id in self._sessions:
                # 既存セッションをOrderedDictの末尾（最近使用）に移動
                self._sessions.move_to_end(session_id)
                return session_id, list(self._sessions[session_id])

            # 新規セッションを生成
            new_session_id = str(uuid.uuid4())
            self._sessions[new_session_id] = []
            self._evict_oldest()
            return new_session_id, []

    def update_session(
        self, session_id: str, user_message: str, assistant_response: str
    ) -> None:
        """
        セッションの会話履歴にメッセージペアを追加する。
        セッションをOrderedDictの末尾（最近使用）に移動する。

        Args:
            session_id: セッションID
            user_message: ユーザーメッセージ
            assistant_response: アシスタント応答
        """
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = []

            self._sessions[session_id].append(
                {"role": "user", "content": user_message}
            )
            self._sessions[session_id].append(
                {"role": "assistant", "content": assistant_response}
            )

            # セッションをOrderedDictの末尾（最近使用）に移動
            self._sessions.move_to_end(session_id)

    def _evict_oldest(self) -> None:
        """
        セッション数が上限を超えた場合、最も古いセッションを削除する（LRU方式）。
        このメソッドは _lock が取得済みの状態で呼び出されることを前提とする。
        """
        while len(self._sessions) > self._max_sessions:
            # OrderedDictの先頭（最も古い）セッションを削除
            self._sessions.popitem(last=False)
