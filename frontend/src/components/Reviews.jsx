import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const Reviews = ({ productId, rentalId, type }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [productId, rentalId]);

  const fetchReviews = async () => {
    try {
      let url = '';
      if (type === 'product' && productId) {
        url = `/products/${productId}/reviews/`;
      } else if (type === 'rental' && rentalId) {
        url = `/rentals/${rentalId}/reviews/`;
      } else {
        return;
      }
      const response = await API.get(url);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setMessage('Пожалуйста, войдите в систему');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      let url = '';
      if (type === 'product' && productId) {
        url = `/products/${productId}/add-review/`;
      } else if (type === 'rental' && rentalId) {
        url = `/rentals/${rentalId}/add-review/`;
      } else {
        return;
      }
      const response = await API.post(url, { rating: parseInt(rating), comment });
      setMessage(response.data.message);
      setComment('');
      setRating(5);
      fetchReviews();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ошибка добавления отзыва');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (ratingValue) => {
    return '⭐'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue);
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h3> Отзывы ({reviews.length})</h3>
      
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      
      {/* Форма добавления отзыва */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} style={{ background: '#f5f5f0', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h4>Оставить отзыв (+50 бонусов)</h4>
          <div className="form-group">
            <label>Оценка</label>
            <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
              <option value={5}>5 - Отлично</option>
              <option value={4}>4 - Хорошо</option>
              <option value={3}>3 - Нормально</option>
              <option value={2}>2 - Плохо</option>
              <option value={1}>1 - Ужасно</option>
            </select>
          </div>
          <div className="form-group">
            <label>Комментарий</label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Поделитесь впечатлениями..."
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить отзыв (+50 бонусов)'}
          </button>
        </form>
      )}
      
      {/* Список отзывов */}
      {reviews.length === 0 ? (
        <p>Пока нет отзывов. Будьте первым!</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>{review.user}</strong>
              <span>{renderStars(review.rating)}</span>
              <span style={{ color: '#666', fontSize: '12px' }}>
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <p>{review.comment}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Reviews;