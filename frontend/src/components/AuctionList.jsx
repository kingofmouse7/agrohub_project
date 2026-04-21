import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [bidAmount, setBidAmount] = useState({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await API.get('/auctions/');
      setAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setMessage('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (auctionId, currentPrice) => {
    if (!isAuthenticated) {
      setMessage('Пожалуйста, войдите в систему');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const amount = parseFloat(bidAmount[auctionId]);
    if (!amount || amount <= currentPrice) {
      setMessage(`Ставка должна быть выше ${currentPrice} ₽`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await API.post(`/auctions/${auctionId}/place_bid/`, { amount });
      setMessage('Ставка принята!');
      fetchAuctions();
      setBidAmount({ ...bidAmount, [auctionId]: '' });
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ошибка ставки');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getTimeLeft = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return 'Торги завершены';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (86400000)) / 3600000);
    if (days > 0) return `${days}д ${hours}ч`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}ч ${minutes}м`;
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <h1 style={{ margin: '32px 0' }}> Торги</h1>
      
      {message && <div className="alert alert-success">{message}</div>}
      
      {auctions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Нет активных торгов</p>
        </div>
      ) : (
        <div className="products-grid">
          {auctions.map((auction) => (
            <div key={auction.id} className="product-card">
              <img 
                src={auction.image || 'https://via.placeholder.com/300x200?text=Торги'} 
                alt={auction.product_name}
                className="product-image"
              />
              <div className="product-info">
                <div className="product-title">{auction.product_name}</div>
                <div className="product-price"> {auction.current_price} ₽</div>
                <div style={{ fontSize: '14px', margin: '5px 0' }}>
                  Стартовая цена: {auction.starting_price} ₽
                </div>
                <div style={{ fontSize: '14px', color: '#d32f2f' }}>
                   Осталось: {getTimeLeft(auction.end_date)}
                </div>
                <div className="product-seller">Продавец: {auction.seller_name}</div>
                
                {isAuthenticated && auction.is_active && getTimeLeft(auction.end_date) !== 'Торги завершены' && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="Ваша ставка"
                        value={bidAmount[auction.id] || ''}
                        onChange={(e) => setBidAmount({ ...bidAmount, [auction.id]: e.target.value })}
                        style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={() => placeBid(auction.id, auction.current_price)}
                      >
                        Сделать ставку
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionList;