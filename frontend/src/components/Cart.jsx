import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [useBonus, setUseBonus] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { profile, fetchWallet } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await API.get('/cart/');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setMessage('Ошибка загрузки корзины');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await API.delete('/cart/', { data: { item_id: itemId } });
      fetchCart();
      setMessage('Товар удалён из корзины');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Ошибка удаления');
      setMessageType('error');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await API.post('/cart/', { item_id: itemId, quantity });
      fetchCart();
    } catch (error) {
      setMessage('Ошибка обновления');
      setMessageType('error');
    }
  };

  const checkout = async () => {
    setCheckoutLoading(true);
    try {
      const bonusUsed = useBonus ? Math.min(profile?.bonus_points || 0, cart?.total || 0) : 0;
      const response = await API.post('/checkout/', { bonus_used: bonusUsed });
      setMessage(response.data.message);
      // Обновляем данные пользователя
      await fetchWallet();
      // Очищаем корзину
      setCart(null);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ошибка оформления заказа');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Загрузка...</div>;
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container">
        <h1 style={{ margin: '32px 0' }}> Корзина</h1>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Ваша корзина пуста</p>
          <a href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
            Перейти к покупкам
          </a>
        </div>
      </div>
    );
  }

  const total = cart.total || 0;
  const bonusAvailable = profile?.bonus_points || 0;
  const bonusToUse = useBonus ? Math.min(bonusAvailable, total) : 0;
  const finalTotal = total - bonusToUse;

  return (
    <div className="container">
      <h1 style={{ margin: '32px 0' }}>🛒 Корзина</h1>
      
      {message && (
        <div className={`alert alert-${messageType === 'success' ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      {cart.items.map((item) => (
        <div key={item.id} className="cart-item">
          <div style={{ flex: 2 }}>
            <h3>{item.product?.name}</h3>
            <p>{item.product?.price} ₽ × {item.quantity} шт</p>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
              min="1"
              style={{ width: '60px', padding: '5px' }}
            />
            <strong>{item.total} ₽</strong>
            <button 
              className="btn-danger" 
              onClick={() => removeItem(item.id)}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
      
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '16px', 
        marginTop: '24px' 
      }}>
        <h3>Итого к оплате: {finalTotal.toLocaleString()} ₽</h3>
        
        {bonusAvailable > 0 && (
          <div style={{ margin: '16px 0' }}>
            <label>
              <input 
                type="checkbox" 
                checked={useBonus} 
                onChange={(e) => setUseBonus(e.target.checked)} 
              />
              Использовать бонусы (доступно {bonusAvailable} баллов)
            </label>
            {useBonus && bonusToUse > 0 && (
              <div className="alert alert-info" style={{ marginTop: '10px' }}>
                Списывается {bonusToUse} баллов. Экономия: {bonusToUse} ₽
              </div>
            )}
          </div>
        )}
        
        <button 
          className="btn-primary" 
          onClick={checkout}
          disabled={checkoutLoading}
          style={{ fontSize: '18px', padding: '12px 30px' }}
        >
          {checkoutLoading ? 'Оформление...' : 'Оплатить'}
        </button>
      </div>
    </div>
  );
};

export default Cart;