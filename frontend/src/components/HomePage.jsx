import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Акции и баннеры
  const banners = [
    {
      id: 1,
      title: ' Весенняя распродажа!',
      subtitle: 'Скидки до 50% на семена и удобрения',
      color: '#2e7d32',
      buttonText: 'В каталог',
      link: '/products'
    },
    {
      id: 2,
      title: ' Аренда техники',
      subtitle: 'Спецпредложение: первые 3 дня в подарок!',
      color: '#5d4037',
      buttonText: 'Выбрать технику',
      link: '/rentals'
    },
    {
      id: 3,
      title: ' Торги',
      subtitle: 'Успейте купить элитные семена по лучшей цене',
      color: '#ff9800',
      buttonText: 'Участвовать',
      link: '/auctions'
    },
    {
      id: 4,
      title: ' Бонусная программа',
      subtitle: 'Получайте 5% кэшбэк за каждую покупку',
      color: '#9c27b0',
      buttonText: 'Подробнее',
      link: '/profile'
    }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [productsRes, rentalsRes, auctionsRes] = await Promise.all([
        API.get('/products/'),
        API.get('/rentals/'),
        API.get('/auctions/')
      ]);
      setProducts(productsRes.data);
      setRentals(rentalsRes.data);
      setAuctions(auctionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    try {
      await API.post('/cart/', { product_id: productId, quantity: 1 });
      alert('✅ Товар добавлен в корзину!');
    } catch (error) {
      alert('Ошибка добавления в корзину');
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <>
      {/* Слайдер с акциями */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation={true}
        effect="fade"
        style={{ height: '400px', marginBottom: '40px' }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div style={{
              background: `linear-gradient(135deg, ${banner.color}, ${banner.color}dd)`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'white',
              cursor: 'pointer'
            }} onClick={() => navigate(banner.link)}>
              <div style={{ padding: '20px' }}>
                <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>{banner.title}</h1>
                <p style={{ fontSize: '20px', marginBottom: '24px', opacity: 0.95 }}>{banner.subtitle}</p>
                <button className="btn-primary" style={{
                  background: 'white',
                  color: banner.color,
                  fontSize: '16px',
                  padding: '12px 32px'
                }}>
                  {banner.buttonText} →
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="container">
        {/* Товары */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
          <h2> Популярные товары</h2>
          <button onClick={() => navigate('/products')} className="btn-outline">
            Показать все ({products.length}) →
          </button>
        </div>
        <div className="products-grid">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
              <img 
                src={product.image || 'https://via.placeholder.com/300x200?text=Agrohub'} 
                alt={product.name}
                className="product-image"
              />
              <div className="product-info">
                <div className="product-title">{product.name}</div>
                <div className="product-price">{Number(product.price).toLocaleString()} ₽</div>
                <div className="product-seller"> {product.seller_name}</div>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '12px' }} 
                  onClick={(e) => addToCart(product.id, e)}
                >
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px' }}>Нет доступных товаров</p>
        )}

        {/* Аренда */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '60px' }}>
          <h2> Техника в аренду</h2>
          <button onClick={() => navigate('/rentals')} className="btn-outline">
            Показать все ({rentals.length}) →
          </button>
        </div>
        <div className="products-grid">
          {rentals.slice(0, 4).map((rental) => (
            <div key={rental.id} className="product-card" onClick={() => navigate('/rentals')}>
              <img 
                src={rental.image || 'https://via.placeholder.com/300x200?text=Аренда'} 
                alt={rental.name}
                className="product-image"
              />
              <div className="product-info">
                <div className="product-title">{rental.name}</div>
                <div className="product-price">{rental.price_per_day} ₽/день</div>
                {rental.deposit > 0 && (
                  <div style={{ fontSize: '12px', color: '#666' }}> Залог: {rental.deposit} ₽</div>
                )}
                <button className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  Арендовать
                </button>
              </div>
            </div>
          ))}
        </div>
        {rentals.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px' }}>Нет техники в аренду</p>
        )}

        {/* Торги */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '60px' }}>
          <h2> Активные торги</h2>
          <button onClick={() => navigate('/auctions')} className="btn-outline">
            Показать все ({auctions.length}) →
          </button>
        </div>
        <div className="products-grid">
          {auctions.slice(0, 4).map((auction) => (
            <div key={auction.id} className="product-card" onClick={() => navigate('/auctions')}>
              <img 
                src={auction.image || 'https://via.placeholder.com/300x200?text=Торги'} 
                alt={auction.product_name}
                className="product-image"
              />
              <div className="product-info">
                <div className="product-title">{auction.product_name}</div>
                <div className="product-price"> {auction.current_price} ₽</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Старт: {auction.starting_price} ₽
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  Сделать ставку
                </button>
              </div>
            </div>
          ))}
        </div>
        {auctions.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px' }}>Нет активных торгов</p>
        )}

        {/* Преимущества */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          margin: '60px 0',
          padding: '40px',
          background: 'white',
          borderRadius: '16px'
        }}>
          
        </div>
      </div>
    </>
  );
};

export default HomePage;