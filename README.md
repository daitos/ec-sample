# eコマースウェブサイト

3層アーキテクチャに基づいたシンプルなeコマースウェブサイトです。

## アーキテクチャ

- **フロントエンド**: React (ポート 3000)
- **バックエンド**: Node.js / Express (ポート 5000)
- **データベース**: SQLite

## セットアップと起動方法

### 1. 依存関係のインストール

```bash
# ルートディレクトリで実行（バックエンドの依存関係）
npm install

# フロントエンドの依存関係
cd frontend && npm install
```

### 2. データベースの初期化

```bash
# ルートディレクトリで実行
node backend/initDb.js
```

### 3. バックエンドサーバーの起動

```bash
# ルートディレクトリで実行
node backend/server.js
```

### 4. フロントエンドの起動（別ターミナルで）

```bash
cd frontend
npm start
```

ブラウザで http://localhost:3000 を開いてください。

## 機能

- **ホームページ**: 20個の商品をカテゴリーフィルター付きで表示
- **商品ページ**: 商品詳細、価格、数量選択、カートに追加、ユーザーレビュー
- **カートページ**: 商品リスト、数量変更、削除、合計金額、注文確定

## API エンドポイント

| メソッド | パス | 説明 |
|--------|------|------|
| GET | /api/products | 全商品取得 |
| GET | /api/products/:id | 特定商品取得 |
| GET | /api/products/:id/reviews | 商品レビュー取得 |
| GET | /api/cart | カート内容取得 |
| POST | /api/cart | カートに追加 |
| PUT | /api/cart/:id | 数量更新 |
| DELETE | /api/cart/:id | アイテム削除 |
| DELETE | /api/cart | カートを空にする |
