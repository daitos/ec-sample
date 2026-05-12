const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'ecommerce.db'));

db.serialize(() => {
  // テーブルを作成
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    emoji TEXT NOT NULL,
    category TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  // サンプル商品データを挿入
  const products = [
    { name: 'ノートパソコン', description: '高性能な最新モデルのノートパソコン。軽量で持ち運びに便利です。', price: 89999, emoji: '💻', category: '電子機器' },
    { name: 'スマートフォン', description: '最新のスマートフォン。高解像度カメラと大容量バッテリー搭載。', price: 69999, emoji: '📱', category: '電子機器' },
    { name: 'ワイヤレスイヤホン', description: 'ノイズキャンセリング機能付きの高音質イヤホン。', price: 12999, emoji: '🎧', category: '電子機器' },
    { name: 'スマートウォッチ', description: '健康管理機能が充実したスマートウォッチ。', price: 24999, emoji: '⌚', category: '電子機器' },
    { name: 'タブレット', description: '大画面で動画視聴や読書に最適なタブレット。', price: 45999, emoji: '📱', category: '電子機器' },
    { name: 'コーヒーメーカー', description: '本格的なエスプレッソが楽しめるコーヒーメーカー。', price: 15999, emoji: '☕', category: '家電' },
    { name: 'ブレンダー', description: 'パワフルなモーターで滑らかなスムージーが作れます。', price: 8999, emoji: '🥤', category: '家電' },
    { name: '電子レンジ', description: '多機能な電子レンジ。オーブン機能も搭載。', price: 19999, emoji: '🔥', category: '家電' },
    { name: '掃除機', description: 'コードレスで使いやすいスティック型掃除機。', price: 29999, emoji: '🧹', category: '家電' },
    { name: '空気清浄機', description: 'HEPAフィルター搭載の高性能空気清浄機。', price: 22999, emoji: '💨', category: '家電' },
    { name: 'ランニングシューズ', description: 'クッション性に優れたランニングシューズ。', price: 9999, emoji: '👟', category: 'スポーツ' },
    { name: 'ヨガマット', description: '滑りにくく快適なヨガマット。収納バッグ付き。', price: 3999, emoji: '🧘', category: 'スポーツ' },
    { name: 'ダンベルセット', description: '調整可能な重量のダンベルセット。', price: 14999, emoji: '💪', category: 'スポーツ' },
    { name: 'バックパック', description: '大容量で機能的なバックパック。PC収納可能。', price: 7999, emoji: '🎒', category: 'ファッション' },
    { name: 'サングラス', description: 'UV カット機能付きのおしゃれなサングラス。', price: 5999, emoji: '🕶️', category: 'ファッション' },
    { name: '腕時計', description: 'クラシックなデザインの腕時計。防水機能付き。', price: 18999, emoji: '⌚', category: 'ファッション' },
    { name: '本（ビジネス書）', description: '成功するための実践的なビジネス書。', price: 1999, emoji: '📚', category: '書籍' },
    { name: 'ボードゲーム', description: '家族や友人と楽しめるボードゲーム。', price: 4999, emoji: '🎲', category: 'おもちゃ' },
    { name: 'ギター', description: '初心者にも優しいアコースティックギター。', price: 24999, emoji: '🎸', category: '楽器' },
    { name: '観葉植物', description: 'お部屋を明るくする観葉植物。育てやすい品種。', price: 2999, emoji: '🌱', category: 'インテリア' }
  ];

  const insertProduct = db.prepare('INSERT INTO products (name, description, price, emoji, category) VALUES (?, ?, ?, ?, ?)');
  products.forEach(product => {
    insertProduct.run(product.name, product.description, product.price, product.emoji, product.category);
  });
  insertProduct.finalize();

  // サンプルレビューデータを挿入
  const reviews = [
    { product_id: 1, user_name: '田中太郎', rating: 5, comment: '非常に高性能で満足しています！' },
    { product_id: 1, user_name: '佐藤花子', rating: 4, comment: '軽くて持ち運びやすいです。' },
    { product_id: 2, user_name: '鈴木一郎', rating: 5, comment: 'カメラの画質が素晴らしい！' },
    { product_id: 2, user_name: '山田美咲', rating: 5, comment: 'バッテリーが長持ちします。' },
    { product_id: 3, user_name: '高橋健', rating: 4, comment: '音質が良く、ノイズキャンセリングも優秀。' },
    { product_id: 4, user_name: '伊藤愛', rating: 5, comment: '健康管理に役立っています。' },
    { product_id: 5, user_name: '渡辺誠', rating: 4, comment: '画面が大きくて見やすいです。' },
    { product_id: 6, user_name: '中村由美', rating: 5, comment: '毎朝美味しいコーヒーが飲めます。' },
    { product_id: 11, user_name: '小林大輔', rating: 5, comment: 'クッション性が良く、走りやすい！' },
    { product_id: 12, user_name: '加藤さくら', rating: 4, comment: 'ヨガに最適なマットです。' }
  ];

  const insertReview = db.prepare('INSERT INTO reviews (product_id, user_name, rating, comment) VALUES (?, ?, ?, ?)');
  reviews.forEach(review => {
    insertReview.run(review.product_id, review.user_name, review.rating, review.comment);
  });
  insertReview.finalize();

  console.log('データベースの初期化が完了しました！');
});

db.close();
