# 実装計画: ショッピングアシスタントチャットボット

## 概要

本ドキュメントは、ショッピングアシスタントチャットボットの実装タスクを定義します。
Chatbot_Service（Python/FastAPI + Strands Agents SDK）とフロントエンドのChat_UI（React）を段階的に実装し、既存のeコマースアプリケーションに統合します。

## タスク

- [x] 1. Chatbot_Serviceのプロジェクト基盤を構築する
  - `chatbot/` ディレクトリ配下にディレクトリ構成を作成する
  - `chatbot/requirements.txt` に全依存ライブラリ（fastapi, uvicorn, strands-agents, boto3, requests, python-dotenv, pytest, hypothesis, responses 等）をバージョン固定で記述する
  - `chatbot/.env.example` に必要な環境変数（AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_SESSION_TOKEN, AWS_BEARER_TOKEN_BEDROCK, CHATBOT_PORT, BACKEND_API_URL, CORS_ORIGINS）の一覧と説明を記述する
  - `chatbot/app/__init__.py`、`chatbot/app/tools/__init__.py`、`chatbot/tests/__init__.py` を作成する
  - _Requirements: 8.2, 8.3, 8.5_

- [ ] 2. SessionManagerを実装する
  - [x] 2.1 `chatbot/app/session.py` に SessionManager クラスを実装する
    - `collections.OrderedDict` と `threading.Lock` を使用してスレッドセーフなLRUキャッシュを実装する
    - `__init__(self, max_sessions: int = 100)` でセッション上限を設定する
    - `get_or_create_session(session_id)` でセッション取得または新規生成（UUID）を実装する
    - `update_session(session_id, user_message, assistant_response)` で会話履歴にメッセージペアを追加し、セッションをOrderedDictの末尾に移動する
    - `_evict_oldest()` でセッション数が上限を超えた場合に先頭（最古）セッションを削除する
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Property 1: セッション履歴の保存と取得の一貫性をテストする（Hypothesis）
    - **Property 1: セッション履歴の保存と取得の一貫性**
    - **Validates: Requirements 3.1, 3.3**
    - 任意の session_id と任意の数のメッセージペアに対して、`update_session` で追加後に `get_or_create_session` で取得した会話履歴が全メッセージペアを正しい順序で含むことを検証する
    - `chatbot/tests/test_session.py` に実装する

  - [ ]* 2.3 Property 2: LRUキャッシュの上限管理をテストする（Hypothesis）
    - **Property 2: LRUキャッシュの上限管理**
    - **Validates: Requirements 3.5**
    - 任意の最大セッション数N（1以上）とN+k個（k >= 1）のセッションに対して、追加後のセッション総数がN以下であり、最後にアクセスされたN個のセッションが保持されることを検証する
    - `chatbot/tests/test_session.py` に実装する

  - [ ]* 2.4 SessionManagerのUnit Testsを書く
    - 新規セッション生成（session_id=None）のテスト
    - 既存セッション取得のテスト
    - セッションIDがNoneの場合の新規生成テスト
    - `chatbot/tests/test_session.py` に実装する
    - _Requirements: 3.1, 3.4_

- [ ] 3. 商品情報ツールを実装する
  - [x] 3.1 `chatbot/app/tools/product_tools.py` に商品情報ツールを実装する
    - `BACKEND_API_URL` 環境変数（デフォルト: `http://localhost:5000`）を読み込む
    - `_call_backend(method, path, **kwargs)` 共通関数を実装し、ConnectionError・Timeout・HTTPError を適切にキャッチしてエラーJSONを返す
    - `@tool` デコレータを使用して `get_products()` を実装し、`GET /api/products` を呼び出す
    - `@tool` デコレータを使用して `get_product_detail(product_id: int)` を実装し、`GET /api/products/{product_id}` を呼び出す
    - _Requirements: 4.1, 4.2, 4.5, 8.4_

  - [ ]* 3.2 Property 3: get_product_detail のURL生成をテストする（Hypothesis + responses）
    - **Property 3: get_product_detail のURL生成**
    - **Validates: Requirements 4.2**
    - 任意の正の整数 product_id に対して、`get_product_detail(product_id)` が `/api/products/{product_id}` エンドポイントへGETリクエストを送信することを検証する
    - `chatbot/tests/test_product_tools.py` に実装する

  - [ ]* 3.3 商品情報ツールのUnit Testsを書く
    - バックエンドAPI接続エラー時のエラーオブジェクト返却テスト
    - タイムアウト時のエラーオブジェクト返却テスト
    - `chatbot/tests/test_product_tools.py` に実装する
    - _Requirements: 4.5_

- [ ] 4. カート操作ツールを実装する
  - [x] 4.1 `chatbot/app/tools/cart_tools.py` にカート操作ツールを実装する
    - `@tool` デコレータを使用して `get_cart()` を実装し、`GET /api/cart` を呼び出す
    - `@tool` デコレータを使用して `add_to_cart(product_id: int, quantity: int)` を実装し、`POST /api/cart` に `{"product_id": product_id, "quantity": quantity}` ボディでリクエストを送信する
    - `@tool` デコレータを使用して `remove_from_cart(cart_item_id: int)` を実装し、`DELETE /api/cart/{cart_item_id}` を呼び出す
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 8.4_

  - [ ]* 4.2 Property 4: add_to_cart のリクエスト生成をテストする（Hypothesis + responses）
    - **Property 4: add_to_cart のリクエスト生成**
    - **Validates: Requirements 5.2**
    - 任意の正の整数 product_id と quantity に対して、`add_to_cart(product_id, quantity)` が `/api/cart` エンドポイントへ `{"product_id": product_id, "quantity": quantity}` ボディでPOSTリクエストを送信することを検証する
    - `chatbot/tests/test_cart_tools.py` に実装する

  - [ ]* 4.3 Property 5: remove_from_cart のURL生成をテストする（Hypothesis + responses）
    - **Property 5: remove_from_cart のURL生成**
    - **Validates: Requirements 5.3**
    - 任意の正の整数 cart_item_id に対して、`remove_from_cart(cart_item_id)` が `/api/cart/{cart_item_id}` エンドポイントへDELETEリクエストを送信することを検証する
    - `chatbot/tests/test_cart_tools.py` に実装する

  - [ ]* 4.4 カート操作ツールのUnit Testsを書く
    - バックエンドAPI接続エラー時のエラーオブジェクト返却テスト
    - `chatbot/tests/test_cart_tools.py` に実装する
    - _Requirements: 5.7_

- [x] 5. チェックポイント — 全テストが通ることを確認する
  - 全テストが通ることを確認する。問題があればユーザーに確認する。

- [ ] 6. Agentモジュールを実装する
  - [x] 6.1 `chatbot/app/agent.py` に `create_agent()` と `run_agent()` を実装する
    - `create_agent()` でAWS認証情報の設定フローを実装する
      1. `AWS_BEARER_TOKEN_BEDROCK` が設定されている場合 → `api_key=` でBedrockModelを初期化する
      2. `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` が設定されている場合 → 通常認証（`AWS_SESSION_TOKEN` が設定されていれば一時認証情報として含める）でBedrockModelを初期化する
      3. どちらも未設定の場合 → エラーログを出力して `EnvironmentError` を送出する
    - `BedrockModel` を `model_id="amazon.nova-pro-v1:0"` で初期化し、`Agent` にシステムプロンプトと全Toolsを設定する
    - `run_agent(agent, message, conversation_history)` で会話履歴を渡してAgentを実行し、応答テキストを返す
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. FastAPIサーバーを実装する
  - [x] 7.1 `chatbot/app/server.py` にFastAPIアプリとエンドポイントを実装する
    - `ChatRequest`（message: str, session_id: Optional[str]）と `ChatResponse`（response: str, session_id: str）のPydanticモデルを定義する
    - `POST /chat` エンドポイントを実装する
      - SessionManagerでセッションを取得/作成する
      - `run_agent()` でAgentを呼び出す
      - SessionManagerで会話履歴を更新する
      - `{response, session_id}` を返す
      - `message` フィールド欠如時はHTTP 400を返す
      - Agent処理エラー時はHTTP 500を返す
    - `GET /health` エンドポイントを実装し、`{status: "ok", service: "shopping-assistant-chatbot", version: "1.0.0"}` を返す
    - `CORS_ORIGINS` 環境変数（デフォルト: `http://localhost:3000`）を使用してCORSMiddlewareを設定する
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 7.2 FastAPIエンドポイントのUnit Testsを書く
    - POST /chat: 有効なリクエストで200レスポンスのテスト
    - POST /chat: messageフィールド欠如で400エラーのテスト
    - GET /health: ヘルスチェックレスポンスのテスト
    - CORS設定の確認テスト
    - `chatbot/tests/test_server.py` に実装する
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 8. エントリーポイントを実装する
  - `chatbot/main.py` を実装する
    - `python-dotenv` で `.env` ファイルを読み込む
    - `create_agent()` を呼び出してAgentを初期化する（EnvironmentError 時はログ出力してプロセス終了）
    - `CHATBOT_PORT` 環境変数（デフォルト: 8000）を読み込み、uvicornでFastAPIアプリを起動する
    - _Requirements: 1.4, 1.5, 8.1_

- [x] 9. チェックポイント — 全テストが通ることを確認する
  - 全テストが通ることを確認する。問題があればユーザーに確認する。

- [ ] 10. フロントエンドのChatWidgetコンポーネントを実装する
  - [x] 10.1 `frontend/src/components/ChatWidget.js` を実装する
    - `isOpen`、`messages`、`inputValue`、`isLoading` のstateを定義する
    - 初期メッセージ（アシスタントの挨拶）を `messages` に設定する
    - `sessionStorage` から `chatbot_session_id` を読み込み、POST /chat リクエストに含める
    - レスポンスの `session_id` を `sessionStorage.setItem('chatbot_session_id', ...)` で保存する
    - `AbortController` で30秒タイムアウトを実装する
    - HTTP エラー・ネットワークエラー・タイムアウト時にエラーメッセージを `messages` に追加する
    - メッセージ追加時に `messagesEndRef` で自動スクロールする
    - Enterキー（Shift+Enterを除く）で送信する
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 10.2 `frontend/src/components/ChatWidget.css` を実装する
    - フローティングボタン（右下固定、z-index: 1000）のスタイルを実装する
    - チャットウィンドウ（360x520px、右下固定）のスタイルを実装する
    - ユーザーメッセージ（青背景、右寄せ）とアシスタント応答（グレー背景、左寄せ）を視覚的に区別するスタイルを実装する
    - エラーメッセージ（赤背景）のスタイルを実装する
    - 3点アニメーションのローディングインジケーターを実装する
    - _Requirements: 7.3, 7.5, 7.7_

  - [ ]* 10.3 Property 6: フロントエンドのsession_id永続化をテストする（@fast-check/jest）
    - **Property 6: フロントエンドのsession_id永続化**
    - **Validates: Requirements 7.8**
    - 任意の有効な session_id 文字列に対して、Chatbot_Service からのレスポンス受信後に `sessionStorage.getItem('chatbot_session_id')` が受信した session_id と同じ値を返すことを検証する
    - `frontend/src/components/ChatWidget.test.js` に実装する

  - [ ]* 10.4 ChatWidgetのUnit Testsを書く
    - フローティングボタンの表示テスト
    - ボタンクリック時のチャットウィンドウ表示テスト
    - メッセージ入力フィールド・送信ボタン・会話履歴エリアの存在テスト
    - ユーザーメッセージとアシスタント応答の視覚的区別（CSSクラス）テスト
    - ローディングインジケーターの表示テスト（fetch中）
    - エラーメッセージの表示テスト（fetch失敗時）
    - 空メッセージの送信が無効化されるテスト
    - `frontend/src/components/ChatWidget.test.js` に実装する
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

- [x] 11. App.jsにChatWidgetを統合する
  - `frontend/src/App.js` に `ChatWidget` コンポーネントをインポートして追加する
  - `<Router>` 内の最上位要素に `<ChatWidget />` を配置し、全ページで表示されるようにする
  - `@fast-check/jest` を `frontend/package.json` の devDependencies に追加する（`"@fast-check/jest": "^0.1.1"`）
  - _Requirements: 7.1, 7.2_

- [x] 12. 最終チェックポイント — 全テストが通ることを確認する
  - 全テストが通ることを確認する。問題があればユーザーに確認する。

## 注意事項

- `*` が付いたサブタスクはオプションであり、MVPとして省略可能
- 各タスクは対応する要件番号を参照しており、トレーサビリティを確保している
- チェックポイントで段階的な検証を行い、問題を早期に発見する
- プロパティテストはHypothesis（Python）と@fast-check/jest（JavaScript）を使用し、各テスト100回以上のイテレーションを実行する
- 単体テストとプロパティテストは補完的な関係にある
- Chatbot_Serviceのテスト実行: `cd chatbot && pytest tests/ -v`
- フロントエンドのテスト実行: `cd frontend && npm test -- --watchAll=false`
