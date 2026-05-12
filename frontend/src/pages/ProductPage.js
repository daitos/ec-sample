import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductPage.css';

function ProductPage({ updateCartCount }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then(res => res.json()),
      fetch(`/api/products/${id}/reviews`).then(res => res.json())
    ])
      .then(([productData, reviewsData]) => {
        setProduct(productData);
        setReviews(reviewsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('データの取得エラー:', err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: parseInt(id), quantity })
    })
      .then(res => res.json())
      .then(() => {
        setAddedToCart(true);
        updateCartCount();
        setTimeout(() => setAddedToCart(false), 2000);
      })
      .catch(err => console.error('カートへの追加エラー:', err));
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!product) {
    return (
      <div className="not-found">
        <h2>商品が見つかりません</h2>
        <Link to="/" className="back-link">ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="product-page">
      <Link to="/" className="back-link">← 商品一覧に戻る</Link>

      <div className="product-detail">
        <div className="product-image-section">
          <div className="product-emoji-large">{product.emoji}</div>
          <span className="product-category-badge">{product.category}</span>
        </div>

        <div className="product-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          {averageRating && (
            <div className="rating-summary">
              <span className="stars">{renderStars(Math.round(averageRating))}</span>
              <span className="rating-value">{averageRating} / 5.0</span>
              <span className="review-count">({reviews.length}件のレビュー)</span>
            </div>
          )}

          <p className="product-description">{product.description}</p>

          <div className="price-section">
            <span className="price">¥{product.price.toLocaleString()}</span>
            <span className="tax-note">（税込）</span>
          </div>

          <div className="quantity-section">
            <label htmlFor="quantity">数量:</label>
            <div className="quantity-controls">
              <button
                className="quantity-btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                className="quantity-btn"
                onClick={() => setQuantity(q => Math.min(99, q + 1))}
              >
                ＋
              </button>
            </div>
          </div>

          <button
            className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
            onClick={handleAddToCart}
          >
            {addedToCart ? '✓ カートに追加しました！' : '🛒 カートに追加'}
          </button>

          <Link to="/cart" className="view-cart-link">カートを見る →</Link>
        </div>
      </div>

      <div className="reviews-section">
        <h2>ユーザーレビュー</h2>
        {reviews.length === 0 ? (
          <p className="no-reviews">まだレビューはありません。</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-name">{review.user_name}</span>
                  <span className="review-stars">{renderStars(review.rating)}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
