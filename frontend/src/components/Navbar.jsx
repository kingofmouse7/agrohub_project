import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Скрываем навбар на страницах входа и регистрации
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')}>
        <span> Agrohub</span>
      </div>
      
      {/* Поисковая строка */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', margin: '0 20px' }}>
        <input
          type="text"
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 15px',
            borderRadius: '20px',
            border: 'none',
            outline: 'none',
            fontSize: '14px'
          }}
        />
      </form>
      
      <div className="nav-links">
        <Link to="/products">Товары</Link>
        <Link to="/rentals">Аренда</Link>
        <Link to="/auctions">Торги</Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/cart"> Корзина</Link>
            <Link to="/profile"> {user?.username}</Link>
            {isAdmin && <Link to="/admin"> Админ</Link>}
            <button onClick={logout} className="btn-outline">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;