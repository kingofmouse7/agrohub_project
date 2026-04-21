import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import Reviews from './Reviews';

const RentalDetail = () => {
  const { id } = useParams();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [days, setDays] = useState(1);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRental();
  }, [id]);

  const fetchRental = async () => {
    try {
      const response = await API.get(`/rentals/${id}/`);
      setRental(response.data);
    } catch (error) {
      console.error('Error fetching rental:', error);
      setMessage('Аренда не найдена');
    } finally {
      setLoading(false);
    }
  };

  const handleRent = async () => {
    if (!isAuthenticated) {
      setMessage('Пожалуйста, войдите в систему');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await API.post(`/rentals/${rental.id}/rent/`, { days });
      setMessage(response.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ошибка аренды');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;
  if (!rental) return <div className="container">Аренда не найдена</div>;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn-outline" style={{ margin: '20px 0' }}>
        ← Назад
      </button>
      
      {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}
      
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
            src={rental.image || 'https://via.placeholder.com/400x300?text=Аренда'} 
            alt={rental.name}
            style={{ width: '100%', borderRadius: '12px' }}
          />
        </div>
        <div>
          <h1>{rental.name}</h1>
          <p style={{ fontSize: '24px', color: 'var(--green)', fontWeight: 'bold', margin: '15px 0' }}>
            {rental.price_per_day} ₽/день
          </p>
          {rental.deposit > 0 && (
            <p> Залог: {rental.deposit} ₽</p>
          )}
          <p style={{ margin: '20px 0', lineHeight: '1.6' }}>{rental.description}</p>
          <p> Продавец: {rental.seller_name}</p>
          
          <div style={{ marginTop: '20px' }}>
            <label>Количество дней: </label>
            <input
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              style={{ width: '80px', marginLeft: '10px', padding: '5px' }}
            />
            <p style={{ marginTop: '10px' }}>
              Итого: <strong>{rental.price_per_day * days} ₽</strong>
              {rental.deposit > 0 && ` + залог ${rental.deposit} ₽ = ${rental.price_per_day * days + rental.deposit} ₽`}
            </p>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ marginTop: '20px', padding: '12px 30px', fontSize: '16px' }}
            onClick={handleRent}
          >
            Арендовать
          </button>
        </div>
      </div>

      {/* ОТЗЫВЫ НА АРЕНДУ */}
      {rental && (
        <Reviews rentalId={rental.id} type="rental" />
      )}
      
    </div>
  );
};

export default RentalDetail;