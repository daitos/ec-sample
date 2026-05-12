import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('全て');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('商品の取得エラー:', err);
        setLoading(false);
      });
  }, []);

  const categories = ['全て', ...new Set(products.map(p => p.category))];
  const filteredProducts = filter === '全て' 
    ? products 
    : products.filter(p => p.category === filter);

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="home-page">
      <h1 className="page-title">商品一覧</h1>
      
      <div className="filter-section">
        <label>カテゴリー: </label>
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-button ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <Link to={`/product/${product.id}`} key={product.id} className="product-card">
            <div className="product-emoji">{product.emoji}</div>
            <h3 className="product-name">{product.name}</h3>
            <p className="product-category">{product.category}</p>
            <p className="product-price">¥{product.price.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
