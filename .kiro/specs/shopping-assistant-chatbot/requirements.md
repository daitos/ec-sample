# 要件ドキュメント

## はじめに

本ドキュメントは、既存のeコマースアプリケーションに統合するショッピングアシスタントチャットボットサービスの要件を定義します。

チャットボットサービスは、Python製のStrands Agents SDKを基盤とし、基盤LLMとしてAmazon Bedrock Nova Proを使用する独立したマイクロサービスとして構築されます。フロントエンドにはポップアップ形式のチャットUIを追加し、既存のNode.js/Expressバックエンドが提供する商品・カートAPIと連携することで、ユーザーに自然言語によるショッピング支援を提供します。

## 用語集

- **Chatbot_Service**: Python/Strands Agents SDKで構築された独立したHTTPサービス（デフォルトポート: 8000）
- **Frontend**: Reactで構築されたeコマースフロントエンドアプリケーション
- **Backend**: Node.js/Expressで構築された既存のeコマースバックエンドAPI（ポート: 5000）
- **Nova_Pro**: Amazon Bedrock上で動作するAmazon Nova Proモデル（`amazon.nova-pro-v1:0`）
- **Strands_SDK**: Python製のStrands Agents SDK（エージェントフレームワーク）
- **Chat_UI**: フロントエンドに表示されるポップアップ形式のチャットボットインターフェース
- **Agent**: Strands_SDKで構築されたショッピングアシスタントエージェント
- **Tool**: Agentがバックエンドと連携するために使用するStrands_SDK定義の関数
- **Session**: ユーザーとチャットボット間の一連の会話コンテキスト
- **AWS_Credentials**: Bedrock APIアクセスに使用するAWS認証情報（アクセスキー、シークレットキー、オプションのセッショントークン）
- **Bearer_Token**: 環境変数`AWS_BEARER_TOKEN_BEDROCK`で指定するBedrock APIキー認証方式

---

## 要件

### 要件1: チャットボットサービスの起動と設定

**ユーザーストーリー:** 運用担当者として、環境変数でAWS認証情報を設定するだけでチャットボットサービスを起動できるようにしたい。そうすることで、セキュアかつ柔軟に認証情報を管理できる。

#### 受け入れ基準

1. THE Chatbot_Service SHALL 環境変数`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、および`AWS_REGION`を読み込み、Nova_Proへのアクセスに使用する。
2. WHERE 環境変数`AWS_SESSION_TOKEN`が設定されている場合、THE Chatbot_Service SHALL そのセッショントークンをAWS認証情報に含める。
3. WHERE 環境変数`AWS_BEARER_TOKEN_BEDROCK`が設定されている場合、THE Chatbot_Service SHALL そのBearerトークンをBedrock APIキーとして使用する。
4. IF 必須のAWS認証情報が設定されていない場合、THEN THE Chatbot_Service SHALL 起動時にエラーメッセージをログに出力し、サービスを終了する。
5. THE Chatbot_Service SHALL 環境変数`CHATBOT_PORT`が設定されている場合はそのポートで、設定されていない場合はポート8000でHTTPサーバーを起動する。
6. THE Chatbot_Service SHALL 環境変数`BACKEND_API_URL`を読み込み、バックエンドAPIのベースURLとして使用する。設定されていない場合は`http://localhost:5000`をデフォルト値とする。

---

### 要件2: チャットAPIエンドポイント

**ユーザーストーリー:** フロントエンド開発者として、チャットボットサービスにHTTPリクエストを送信してユーザーメッセージを処理し、アシスタントの応答を受け取れるようにしたい。そうすることで、フロントエンドのChat_UIとチャットボットサービスを疎結合に統合できる。

#### 受け入れ基準

1. THE Chatbot_Service SHALL `POST /chat`エンドポイントを公開し、JSONリクエストボディ（`message`フィールドと`session_id`フィールドを含む）を受け付ける。
2. WHEN `POST /chat`リクエストを受信した場合、THE Chatbot_Service SHALL Agentを呼び出してユーザーメッセージを処理し、応答テキストをJSONレスポンス（`response`フィールド）として返す。
3. THE Chatbot_Service SHALL `GET /health`エンドポイントを公開し、サービスの稼働状態を示すJSONレスポンスを返す。
4. IF リクエストボディに`message`フィールドが含まれていない場合、THEN THE Chatbot_Service SHALL HTTPステータス400とエラーメッセージを返す。
5. IF Agentの処理中にエラーが発生した場合、THEN THE Chatbot_Service SHALL HTTPステータス500とエラーメッセージを返す。
6. THE Chatbot_Service SHALL CORSヘッダーを設定し、フロントエンドオリジン（デフォルト: `http://localhost:3000`）からのリクエストを許可する。

---

### 要件3: セッション管理と会話コンテキスト

**ユーザーストーリー:** ショッピングユーザーとして、チャットボットとの会話の文脈が維持されるようにしたい。そうすることで、前の発言を繰り返すことなく自然な会話でショッピングを進められる。

#### 受け入れ基準

1. THE Chatbot_Service SHALL `session_id`をキーとして会話履歴をメモリ上に保持する。
2. WHEN 同一`session_id`で複数のリクエストを受信した場合、THE Agent SHALL 過去の会話履歴をコンテキストとして使用してレスポンスを生成する。
3. WHILE セッションが存在する場合、THE Chatbot_Service SHALL 会話履歴（ユーザーメッセージとアシスタント応答のペア）を蓄積する。
4. IF `session_id`が指定されていない場合、THEN THE Chatbot_Service SHALL 新しいセッションを生成し、レスポンスに`session_id`を含める。
5. THE Chatbot_Service SHALL セッションの最大保持数を制限し、古いセッションを自動的に削除することでメモリ使用量を管理する。

---

### 要件4: バックエンドAPI連携ツール（商品情報）

**ユーザーストーリー:** ショッピングユーザーとして、チャットボットに商品について質問したい。そうすることで、商品ページを手動で探すことなく、欲しい商品の情報を素早く入手できる。

#### 受け入れ基準

1. THE Agent SHALL バックエンドの`GET /api/products`エンドポイントを呼び出す`get_products` Toolを持つ。
2. THE Agent SHALL バックエンドの`GET /api/products/{id}`エンドポイントを呼び出す`get_product_detail` Toolを持つ。
3. WHEN ユーザーが商品の検索や推薦を要求した場合、THE Agent SHALL `get_products` Toolを使用して商品一覧を取得し、ユーザーの要求に合った商品を提案する。
4. WHEN ユーザーが特定の商品の詳細（価格、説明、レビューなど）を質問した場合、THE Agent SHALL `get_product_detail` Toolを使用して詳細情報を取得し、回答する。
5. IF バックエンドAPIへのリクエストが失敗した場合、THEN THE Agent SHALL エラーを適切に処理し、ユーザーに分かりやすいエラーメッセージを返す。

---

### 要件5: バックエンドAPI連携ツール（カート操作）

**ユーザーストーリー:** ショッピングユーザーとして、チャットボットを通じてカートを操作したい。そうすることで、商品ページに移動することなく会話の流れの中でカートを管理できる。

#### 受け入れ基準

1. THE Agent SHALL バックエンドの`GET /api/cart`エンドポイントを呼び出す`get_cart` Toolを持つ。
2. THE Agent SHALL バックエンドの`POST /api/cart`エンドポイントを呼び出す`add_to_cart` Toolを持つ。
3. THE Agent SHALL バックエンドの`DELETE /api/cart/{id}`エンドポイントを呼び出す`remove_from_cart` Toolを持つ。
4. WHEN ユーザーがカートへの商品追加を要求した場合、THE Agent SHALL `add_to_cart` Toolを使用して商品をカートに追加し、追加結果をユーザーに通知する。
5. WHEN ユーザーがカートの内容確認を要求した場合、THE Agent SHALL `get_cart` Toolを使用してカート内容を取得し、商品名・数量・合計金額を含む一覧をユーザーに提示する。
6. WHEN ユーザーがカートからの商品削除を要求した場合、THE Agent SHALL `remove_from_cart` Toolを使用して商品を削除し、削除結果をユーザーに通知する。
7. IF カート操作のためのバックエンドAPIリクエストが失敗した場合、THEN THE Agent SHALL エラーを適切に処理し、ユーザーに操作が失敗した旨を通知する。

---

### 要件6: ショッピングアシスタントの応答品質

**ユーザーストーリー:** ショッピングユーザーとして、チャットボットが日本語で自然かつ有用なショッピング支援を提供してほしい。そうすることで、快適なショッピング体験を得られる。

#### 受け入れ基準

1. THE Agent SHALL システムプロンプトに基づき、日本語でショッピング支援に特化した応答を生成する。
2. WHEN ユーザーがショッピングと無関係なトピックについて質問した場合、THE Agent SHALL 丁重にショッピング支援の範囲外であることを伝え、ショッピング関連の質問に誘導する。
3. THE Agent SHALL 商品推薦時に、ユーザーの要求（カテゴリ、価格帯、用途など）に基づいて適切な商品を提案する。
4. WHEN ユーザーがカートに商品を追加するよう依頼した場合、THE Agent SHALL 追加前に商品名と数量を確認し、ユーザーの意図を正確に把握してから操作を実行する。
5. THE Agent SHALL Nova_Proモデルを使用して自然言語処理を行い、ユーザーの意図を正確に解釈する。

---

### 要件7: フロントエンドのポップアップChat_UI

**ユーザーストーリー:** ショッピングユーザーとして、eコマースサイトのどのページからでもチャットボットにアクセスしたい。そうすることで、ショッピング中にいつでも支援を受けられる。

#### 受け入れ基準

1. THE Frontend SHALL 全ページの右下隅にチャットボットを開くためのフローティングボタンを表示する。
2. WHEN フローティングボタンをクリックした場合、THE Frontend SHALL ポップアップ形式のChat_UIを表示する。
3. THE Chat_UI SHALL メッセージ入力フィールド、送信ボタン、および会話履歴表示エリアを含む。
4. WHEN ユーザーがメッセージを送信した場合、THE Frontend SHALL Chatbot_Serviceの`POST /chat`エンドポイントにリクエストを送信し、応答を会話履歴に表示する。
5. WHILE Chatbot_Serviceからの応答を待機している場合、THE Chat_UI SHALL ローディングインジケーターを表示する。
6. IF Chatbot_Serviceへのリクエストが失敗した場合、THEN THE Chat_UI SHALL エラーメッセージをユーザーに表示する。
7. THE Chat_UI SHALL ユーザーメッセージとアシスタント応答を視覚的に区別して表示する。
8. THE Frontend SHALL チャットボットとのセッションを維持するため、`session_id`をブラウザのセッションストレージに保存する。

---

### 要件8: サービスの独立性とデプロイ

**ユーザーストーリー:** 開発者として、チャットボットサービスを既存のバックエンドとは独立してデプロイ・管理したい。そうすることで、各サービスを個別にスケールおよびメンテナンスできる。

#### 受け入れ基準

1. THE Chatbot_Service SHALL 独立したPythonプロセスとして起動し、既存のNode.js/Expressバックエンドとは別のポートで動作する。
2. THE Chatbot_Service SHALL `requirements.txt`ファイルに全ての依存ライブラリとバージョンを明記する。
3. THE Chatbot_Service SHALL `.env.example`ファイルに必要な環境変数の一覧とその説明を提供する。
4. WHEN バックエンドサービスが一時的に利用不可の場合、THE Chatbot_Service SHALL 起動を継続し、バックエンドAPIを必要とするToolの呼び出し時にのみエラーを返す。
5. THE Chatbot_Service SHALL `chatbot/`ディレクトリ配下に全てのソースコードを配置し、既存のプロジェクト構造と分離する。
