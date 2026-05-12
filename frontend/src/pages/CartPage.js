import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CartPage.css';

function CartPage({ updateCartCount }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const fetchCart = () => {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        setCartItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('カートの取得エラー:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    fetch(`/api/cart/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQuantity })
    })
      .then(res => res.json())
      .then(() => {
        setCartItems(items =>
          items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item)
        );
        updateCartCount();
      })
      .catch(err => console.error('数量更新エラー:', err));
  };

  const handleRemoveItem = (id) => {
    fetch(`/api/cart/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setCartItems(items => items.filter(item => item.id !== id));
        updateCartCount();
      })
      .catch(err => console.error('削除エラー:', err));
  };

  const handleClearCart = () => {
    if (!window.confirm('カートを空にしますか？')) return;
    fetch('/api/cart', { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setCartItems([]);
        updateCartCount();
      })
      .catch(err => console.error('カートクリアエラー:', err));
  };

  const handlePlaceOrder = () => {
    if (!window.confirm('注文を確定しますか？')) return;
    fetch('/api/cart', { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setCartItems([]);
        updateCartCount();
        setOrderPlaced(true);
      })
      .catch(err => console.error('注文エラー:', err));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (orderPlaced) {
    return (
      <div className="order-success">
        <div className="success-icon">🎉</div>
        <h2>ご注文ありがとうございます！</h2>
        <p>ご注文が確定しました。商品の発送をお待ちください。</p>
        <Link to="/" className="continue-shopping-btn">ショッピングを続ける</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">ショッピングカート</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>カートは空です</h2>
          <p>商品を追加してください。</p>
          <Link to="/" className="continue-shopping-btn">商品を見る</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-header">
              <h2>{totalItems}点の商品</h2>
              <button className="clear-cart-btn" onClick={handleClearCart}>
                🗑️ カートを空にする
              </button>
            </div>

            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-emoji">{item.emoji}</div>
                  <div className="item-info">
                    <Link to={`/product/${item.product_id}`} className="item-name">
                      {item.name}
                    </Link>
                    <p className="item-unit-price">単価: ¥{item.price.toLocaleString()}</p>
                  </div>
                  <div className="item-quantity-controls">
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      ＋
                    </button>
                  </div>
                  <div className="item-subtotal">
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.id)}
                    title="削除"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="order-summary">
            <h2>注文サマリー</h2>
            <div className="summary-details">
              <div className="summary-row">
                <span>商品数</span>
                <span>{totalItems}点</span>
              </div>
              <div className="summary-row">
                <span>小計</span>
                <span>¥{totalPrice.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>送料</span>
                <span className="free-shipping">無料</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>合計（税込）</span>
                <span className="total-price">¥{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <button className="checkout-btn" onClick={handlePlaceOrder}>
              注文を確定する
            </button>
            <Link to="/" className="continue-link">← ショッピングを続ける</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
