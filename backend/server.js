const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());

// データベース接続
const db = new sqlite3.Database(path.join(__dirname, 'ecommerce.db'), (err) => {
  if (err) {
    console.error('データベース接続エラー:', err);
  } else {
    console.log('データベースに接続しました');
  }
});

// 全商品を取得
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 特定の商品を取得
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '商品が見つかりません' });
      return;
    }
    res.json(row);
  });
});

// 商品のレビューを取得
app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM reviews WHERE product_id = ?', [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// カート内の全アイテムを取得
app.get('/api/cart', (req, res) => {
  const query = `
    SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.emoji
    FROM cart c
    JOIN products p ON c.product_id = p.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// カートにアイテムを追加
app.post('/api/cart', (req, res) => {
  const { product_id, quantity } = req.body;
  
  // 既にカートに存在するか確認
  db.get('SELECT * FROM cart WHERE product_id = ?', [product_id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      // 既存のアイテムの数量を更新
      const newQuantity = row.quantity + quantity;
      db.run('UPDATE cart SET quantity = ? WHERE product_id = ?', [newQuantity, product_id], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'カートを更新しました', id: row.id, quantity: newQuantity });
      });
    } else {
      // 新しいアイテムを追加
      db.run('INSERT INTO cart (product_id, quantity) VALUES (?, ?)', [product_id, quantity], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'カートに追加しました', id: this.lastID });
      });
    }
  });
});

// カートアイテムの数量を更新
app.put('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  if (quantity <= 0) {
    res.status(400).json({ error: '数量は1以上である必要があります' });
    return;
  }
  
  db.run('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'カートを更新しました' });
  });
});

// カートからアイテムを削除
app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM cart WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'カートから削除しました' });
  });
});

// カートを空にする
app.delete('/api/cart', (req, res) => {
  db.run('DELETE FROM cart', [], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'カートを空にしました' });
  });
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
