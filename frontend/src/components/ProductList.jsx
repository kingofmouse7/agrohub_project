import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await API.get('/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setMessage('Пожалуйста, войдите в систему');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await API.post('/cart/', { product_id: productId, quantity: 1 });
      setMessage('✅ Товар добавлен в корзину!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Ошибка добавления в корзину');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="container">Загрузка...</div>;
  }

  return (
    <div className="container">
      <div style={{ margin: '32px 0' }}>
        <h1> Все товары</h1>
        <p>Найдено товаров: {products.length}</p>
      </div>
      
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Нет доступных товаров</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            На главную
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="product-card" 
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <img 
                src={product.image || 'https://via.placeholder.com/300x200?text=Agrohub'} 
                alt={product.name}
                className="product-image"
              />
              <div className="product-info">
                <div className="product-title">{product.name}</div>
                <div className="product-price">{Number(product.price).toLocaleString()} ₽</div>
                <div className="product-seller"> {product.seller_name || 'Администратор'}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                   В наличии: {product.stock} шт
                </div>
                <button 
                  className="btn-primary" 
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={(e) => addToCart(product.id, e)}
                >
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;