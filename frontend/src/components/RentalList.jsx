import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const RentalList = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await API.get('/rentals/');
      console.log('Rentals:', response.data);
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      setMessage('Ошибка загрузки аренды');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const rentItem = async (rentalId, rentalName, pricePerDay) => {
    if (!isAuthenticated) {
      setMessage('Пожалуйста, войдите в систему');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    const days = prompt(`Сколько дней арендовать "${rentalName}"?\nЦена: ${pricePerDay} ₽/день`, '1');
    if (!days) return;
    
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays < 1) {
      setMessage('Введите корректное количество дней');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    try {
      const response = await API.post(`/rentals/${rentalId}/rent/`, { days: numDays });
      setMessage(response.data.message);
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ошибка аренды');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <h1 style={{ margin: '32px 0' }}>🚜 Аренда техники</h1>
      
      {message && (
        <div className={`alert alert-${messageType === 'success' ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      {rentals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Нет доступной техники для аренды</p>
          <p>Добавьте технику в <a href="http://localhost:8000/admin/" target="_blank">админ-панели</a></p>
        </div>
      ) : (
        <div className="products-grid">
          {rentals.map((rental) => (
            <div key={rental.id} className="product-card">
              <img 
                src={rental.image || 'https://via.placeholder.com/300x200?text=Аренда'} 
                alt={rental.name}
                className="product-image"
              />
              <div className="product-info">
                <div className="product-title">{rental.name}</div>
                <div className="product-price">{rental.price_per_day} ₽/день</div>
                {rental.deposit > 0 && (
                  <div style={{ fontSize: '14px', color: '#666' }}> Залог: {rental.deposit} ₽</div>
                )}
                <div className="product-seller"> Продавец: {rental.seller_name || 'Администратор'}</div>
                <p style={{ fontSize: '14px', margin: '10px 0', color: '#666' }}>
                  {rental.description}
                </p>
                <button 
                  className="btn-primary" 
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={() => rentItem(rental.id, rental.name, rental.price_per_day)}
                >
                  Арендовать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentalList;