import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [products, setProducts] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const searchAll = useCallback(async () => {
    if (!query) {
      setProducts([]);
      setRentals([]);
      setAuctions([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Searching for:', query);
      const response = await API.get(`/search/?q=${encodeURIComponent(query)}`);
      console.log('Search results:', response.data);
      setProducts(response.data.products || []);
      setRentals(response.data.rentals || []);
      setAuctions(response.data.auctions || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    searchAll();
  }, [searchAll]);

  const addToCart = async (productId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    try {
      await API.post('/cart/', { product_id: productId, quantity: 1 });
      alert('Товар добавлен в корзину!');
    } catch (error) {
      alert('Ошибка добавления в корзину');
    }
  };

  const rentItem = async (rentalId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    
    const days = prompt('На сколько дней арендовать?', '1');
    if (!days) return;
    
    try {
      const response = await API.post(`/rentals/${rentalId}/rent/`, { days: parseInt(days) });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка аренды');
    }
  };

  const placeBid = async (auctionId, currentPrice, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    
    const amount = prompt('Ваша ставка:', currentPrice + 100);
    if (!amount) return;
    
    try {
      const response = await API.post(`/auctions/${auctionId}/place_bid/`, { amount: parseFloat(amount) });
      alert(response.data.message);
      searchAll(); // Обновляем результаты
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка ставки');
    }
  };

  if (loading) return <div className="container">Поиск...</div>;

  const totalResults = products.length + rentals.length + auctions.length;

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn-outline" style={{ margin: '20px 0' }}>
        ← На главную
      </button>
      
      <h1 style={{ margin: '20px 0' }}>Результаты поиска: "{query}"</h1>
      <p>Найдено: {totalResults} результатов</p>
      
      {totalResults === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p> Ничего не найдено по запросу "{query}"</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Вернуться к покупкам
          </button>
        </div>
      ) : (
        <>
          {/* Товары */}
          {products.length > 0 && (
            <>
              <h2 style={{ marginTop: '40px' }}> Товары ({products.length})</h2>
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                    <img 
                      src={product.image || 'https://via.placeholder.com/300x200?text=Agrohub'} 
                      alt={product.name}
                      className="product-image"
                    />
                    <div className="product-info">
                      <div className="product-title">{product.name}</div>
                      <div className="product-price">{Number(product.price).toLocaleString()} ₽</div>
                      <button className="btn-primary" style={{ width: '100%' }} onClick={(e) => addToCart(product.id, e)}>
                        В корзину
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Аренда */}
          {rentals.length > 0 && (
            <>
              <h2 style={{ marginTop: '40px' }}> Аренда ({rentals.length})</h2>
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
                      <button className="btn-primary" style={{ width: '100%' }} onClick={(e) => rentItem(rental.id, e)}>
                        Арендовать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Торги */}
          {auctions.length > 0 && (
            <>
              <h2 style={{ marginTop: '40px' }}> Торги ({auctions.length})</h2>
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
                      <button className="btn-primary" style={{ width: '100%' }} onClick={(e) => placeBid(auction.id, auction.current_price, e)}>
                        Сделать ставку
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;