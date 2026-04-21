import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const Profile = () => {
  const { user, profile, isSeller, isAdmin, fetchWallet } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [wallet, setWallet] = useState({ balance: 0 });
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 1,
    stock: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchRentals();
    fetchMyAuctions();
    fetchWonAuctions();
    fetchWalletData();
    if (isSeller) {
      fetchMyProducts();
    }
  }, [isSeller]);

  const fetchWalletData = async () => {
    try {
      const response = await API.get('/wallet/');
      setWallet(response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await API.get('/my-orders/');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchRentals = async () => {
    try {
      const response = await API.get('/my-rentals/');
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const fetchMyAuctions = async () => {
    try {
      const response = await API.get('/my-auctions/');
      setMyAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const fetchWonAuctions = async () => {
    try {
      const response = await API.get('/won-auctions/');
      setWonAuctions(response.data);
    } catch (error) {
      console.error('Error fetching won auctions:', error);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const response = await API.get('/my-products/');
      setMyProducts(response.data);
    } catch (error) {
      console.error('Error fetching my products:', error);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Введите корректную сумму');
      return;
    }
    
    setLoading(true);
    try {
      const response = await API.post('/add-funds/', { amount });
      setWallet({ balance: response.data.balance });
      setMessage(response.data.message);
      setAddFundsAmount('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Ошибка пополнения');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/products/', newProduct);
      setMessage('✅ Товар успешно добавлен!');
      setNewProduct({ name: '', description: '', price: '', category: 1, stock: 1 });
      fetchMyProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Ошибка добавления товара');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Удалить этот товар?')) {
      try {
        await API.delete(`/delete-my-product/${productId}/`);
        setMessage('✅ Товар удалён');
        fetchMyProducts();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('❌ Ошибка удаления');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span style={{ color: '#4caf50' }}>🟢 Активна</span>;
      case 'completed': return <span style={{ color: '#2196f3' }}>🔵 Завершена</span>;
      case 'cancelled': return <span style={{ color: '#f44336' }}>🔴 Отменена</span>;
      default: return status;
    }
  };

  return (
    <div className="container">
      <div style={{ margin: '32px 0' }}>
        <h1>Личный кабинет</h1>
        
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}
        
        {/* Информация о пользователе */}
        <div style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: '16px', 
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <strong> Имя пользователя</strong>
            <p>{user?.username}</p>
          </div>
          <div>
            <strong> Email</strong>
            <p>{user?.email || 'Не указан'}</p>
          </div>
          <div>
            <strong> Бонусные баллы</strong>
            <p style={{ color: 'var(--green)', fontSize: '24px', fontWeight: 'bold' }}>
              {profile?.bonus_points || 0}
            </p>
          </div>
          <div>
            <strong> Баланс кошелька</strong>
            <p style={{ color: 'var(--brown)', fontSize: '24px', fontWeight: 'bold' }}>
              {wallet.balance} ₽
            </p>
            <form onSubmit={handleAddFunds} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="number"
                placeholder="Сумма пополнения"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                style={{ flex: 1, padding: '5px' }}
                required
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                Пополнить
              </button>
            </form>
          </div>
          <div>
            <strong> Роль</strong>
            <p>
              {profile?.role === 'seller' && 'Продавец '}
              {profile?.role === 'admin' && 'Администратор '}
              {profile?.role === 'buyer' && 'Покупатель '}
            </p>
          </div>
        </div>

        {/* Вкладки */}
        <div style={{ display: 'flex', gap: '12px', margin: '24px 0', flexWrap: 'wrap' }}>
          <button 
            className={activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveTab('orders')}
          >
             Заказы ({orders.length})
          </button>
          <button 
            className={activeTab === 'rentals' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveTab('rentals')}
          >
             Аренда ({rentals.length})
          </button>
          <button 
            className={activeTab === 'auctions' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveTab('auctions')}
          >
             Мои ставки ({myAuctions.length})
          </button>
          <button 
            className={activeTab === 'won' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setActiveTab('won')}
          >
             Выигранные ({wonAuctions.length})
          </button>
          {isSeller && (
            <>
              <button 
                className={activeTab === 'my-products' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setActiveTab('my-products')}
              >
                 Мои товары ({myProducts.length})
              </button>
              <button 
                className={activeTab === 'add-product' ? 'btn-primary' : 'btn-outline'}
                onClick={() => setActiveTab('add-product')}
              >
                 Добавить товар
              </button>
            </>
          )}
        </div>

        {/* Заказы */}
        {activeTab === 'orders' && (
          <div>
            <h3>История заказов</h3>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
                <p>У вас пока нет заказов</p>
                <a href="/products" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
                  Перейти к покупкам
                </a>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <strong>Заказ #{order.id}</strong>
                    <span> Оплачен</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>Сумма: <strong>{order.total_price} ₽</strong></div>
                  {order.bonus_used > 0 && <div> Использовано бонусов: {order.bonus_used}</div>}
                  {order.bonus_earned > 0 && <div> Начислено бонусов: {order.bonus_earned}</div>}
                  
                  {/* Товары в заказе с кнопкой перехода */}
                  {order.items && order.items.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Товары:</strong>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                          <span>{item.product_name} x{item.quantity}</span>
                          <button 
                            className="btn-outline" 
                            style={{ padding: '3px 10px', fontSize: '12px' }}
                            onClick={() => navigate(`/product/${item.product}`)}
                          >
                            Перейти к товару
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Аренда */}
        {activeTab === 'rentals' && (
          <div>
            <h3>Моя аренда</h3>
            {rentals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
                <p>У вас нет активной аренды</p>
                <a href="/rentals" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
                  Перейти к аренде
                </a>
              </div>
            ) : (
              rentals.map(rental => (
                <div key={rental.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <strong>{rental.name}</strong>
                    {getStatusBadge(rental.status)}
                  </div>
                  <div> {rental.days} дней</div>
                  <div> Стоимость: {rental.total_price} ₽</div>
                  {rental.deposit > 0 && <div> Залог: {rental.deposit} ₽</div>}
                  <div> Начало: {new Date(rental.start_date).toLocaleDateString()}</div>
                  <div> Окончание: {new Date(rental.end_date).toLocaleDateString()}</div>
                  {rental.is_active && (
                    <div style={{ marginTop: '10px', color: '#4caf50' }}>🟢 Активно</div>
                  )}
                  {!rental.is_active && rental.status === 'completed' && (
                    <button 
                      className="btn-primary" 
                      style={{ marginTop: '10px' }}
                      onClick={() => navigate(`/rentals`)}
                    >
                      Оставить отзыв
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Мои ставки */}
        {activeTab === 'auctions' && (
          <div>
            <h3>Мои ставки в торгах</h3>
            {myAuctions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
                <p>Вы ещё не участвовали в торгах</p>
                <a href="/auctions" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
                  Перейти к торгам
                </a>
              </div>
            ) : (
              myAuctions.map(auction => (
                <div key={auction.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <strong>{auction.product_name}</strong>
                    {auction.is_active ? '🟢 Активен' : '🔴 Завершён'}
                  </div>
                  <div> Ваша ставка: {auction.bid_amount} ₽</div>
                  <div> Текущая цена: {auction.current_price} ₽</div>
                  <div> Дата ставки: {new Date(auction.created_at).toLocaleDateString()}</div>
                  {auction.is_active ? (
                    <div style={{ marginTop: '10px', color: '#ff9800' }}>
                       Ваша ставка пока первая. Торги продолжаются до {new Date(auction.end_date).toLocaleDateString()}
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px', color: auction.is_winner ? '#4caf50' : '#f44336' }}>
                      {auction.is_winner ? '🏆 ПОБЕДА! Вы выиграли торги!' : '❌ К сожалению, вы не выиграли'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Выигранные торги */}
        {activeTab === 'won' && (
          <div>
            <h3> Выигранные торги</h3>
            {wonAuctions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
                <p>У вас пока нет выигранных торгов</p>
              </div>
            ) : (
              wonAuctions.map(win => (
                <div key={win.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <strong>{win.product_name}</strong>
                    <span style={{ color: '#ff9800' }}> ПОБЕДА!</span>
                  </div>
                  <div> Выигрышная ставка: {win.winning_bid} ₽</div>
                  <div> Дата завершения: {new Date(win.end_date).toLocaleDateString()}</div>
                  <button 
                    className="btn-primary" 
                    style={{ marginTop: '10px' }}
                    onClick={() => alert('Свяжитесь с продавцом для оформления')}
                  >
                    Связаться с продавцом
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Мои товары */}
        {activeTab === 'my-products' && (
          <div>
            <h3>Мои товары</h3>
            {myProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
                <p>У вас пока нет товаров</p>
                <button onClick={() => setActiveTab('add-product')} className="btn-primary">
                  Добавить товар
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {myProducts.map(product => (
                  <div key={product.id} className="product-card">
                    <img 
                      src={product.image || 'https://via.placeholder.com/300x200?text=Товар'} 
                      alt={product.name}
                      className="product-image"
                    />
                    <div className="product-info">
                      <div className="product-title">{product.name}</div>
                      <div className="product-price">{product.price} ₽</div>
                      <div> В наличии: {product.stock} шт</div>
                      <button 
                        className="btn-danger" 
                        style={{ marginTop: '12px', width: '100%' }}
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Добавление товара */}
        {activeTab === 'add-product' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px' }}>
            <h3>Добавить новый товар</h3>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Название товара *</label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Описание *</label>
                <textarea 
                  rows="4"
                  value={newProduct.description} 
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Цена (₽) *</label>
                <input 
                  type="number" 
                  value={newProduct.price} 
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Количество на складе *</label>
                <input 
                  type="number" 
                  value={newProduct.stock} 
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить товар'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;