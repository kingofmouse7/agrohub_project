import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import Reviews from './Reviews';  // ДОБАВЬТЕ ЭТУ СТРОКУ

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await API.get(`/products/${id}/`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setMessage('Товар не найден');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      setMessage('Пожалуйста, войдите в систему');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await API.post('/cart/', { product_id: product.id, quantity: 1 });
      setMessage('Товар добавлен в корзину!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Ошибка добавления в корзину');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;
  if (!product) return <div className="container">Товар не найден</div>;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn-outline" style={{ margin: '20px 0' }}>
        ← Назад
      </button>
      
      {message && <div className="alert alert-success">{message}</div>}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '40px',
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '40px'
      }}>
        <div>
          <img 
            src={product.image || 'https://via.placeholder.com/400x300?text=Agrohub'} 
            alt={product.name}
            style={{ width: '100%', borderRadius: '12px' }}
          />
        </div>
        <div>
          <h1>{product.name}</h1>
          <p style={{ color: '#666', margin: '10px 0' }}>Категория: {product.category_name}</p>
          <p style={{ fontSize: '28px', color: 'var(--green)', fontWeight: 'bold', margin: '15px 0' }}>
            {product.price} ₽
          </p>
          <p style={{ margin: '20px 0', lineHeight: '1.6' }}>{product.description}</p>
          <p>В наличии: {product.stock} шт</p>
          <p>Продавец: {product.seller_name}</p>
          <button 
            className="btn-primary" 
            style={{ marginTop: '20px', padding: '12px 30px', fontSize: '16px' }}
            onClick={addToCart}
          >
            Добавить в корзину
          </button>
        </div>
      </div>

      {/* КОМПОНЕНТ ОТЗЫВОВ */}
      <Reviews productId={product.id} type="product" />
      
    </div>
  );
};

export default ProductDetail;