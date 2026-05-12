import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        const total = data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      })
      .catch(err => console.error('カート数の取得エラー:', err));
  };

  useEffect(() => {
    updateCartCount();
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="container">
            <Link to="/" className="logo">
              🛒 eコマースストア
            </Link>
            <nav>
              <Link to="/" className="nav-link">ホーム</Link>
              <Link to="/cart" className="nav-link cart-link">
                カート {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductPage updateCartCount={updateCartCount} />} />
            <Route path="/cart" element={<CartPage updateCartCount={updateCartCount} />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2026 eコマースストア. All rights reserved.</p>
          </div>
        </footer>

        <ChatWidget onCartUpdate={updateCartCount} />
      </div>
    </Router>
  );
}

export default App;
