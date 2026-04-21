import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

const AdminPanel = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchStats();
      fetchProducts();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      const response = await API.get('/admin/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await API.get('/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Удалить этот товар?')) {
      try {
        await API.delete(`/admin/product/${id}/`);
        setMessage('Товар удалён');
        fetchProducts();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('Ошибка удаления');
      }
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/update-product/${editingProduct.id}/`, editingProduct);
      setMessage('Товар обновлён');
      setEditingProduct(null);
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Ошибка обновления');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Доступ запрещён</h2>
          <p>У вас нет прав администратора</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="container">Загрузка...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ margin: '32px 0' }}>⚙️ Админ-панель Agrohub</h1>
      
      {message && <div className="alert alert-success">{message}</div>}
      
      {/* Статистика */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total_users || 0}</div>
          <div>Пользователей</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_products || products.length}</div>
          <div>Товаров</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_orders || 0}</div>
          <div>Заказов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_revenue || 0} ₽</div>
          <div>Выручка</div>
        </div>
      </div>

      {/* Редактирование товара */}
      {editingProduct && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3>Редактирование товара</h3>
          <form onSubmit={handleUpdateProduct}>
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Цена (₽)</label>
              <input
                type="number"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Количество</label>
              <input
                type="number"
                value={editingProduct.stock}
                onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={editingProduct.is_available}
                  onChange={(e) => setEditingProduct({...editingProduct, is_available: e.target.checked})}
                />
                Доступен для продажи
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">Сохранить</button>
              <button type="button" className="btn-outline" onClick={() => setEditingProduct(null)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Товары */}
      <h2>Управление товарами</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--brown)', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Название</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Цена</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Кол-во</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{product.id}</td>
                <td style={{ padding: '12px' }}>{product.name}</td>
                <td style={{ padding: '12px' }}>{product.price} ₽</td>
                <td style={{ padding: '12px' }}>{product.stock}</td>
                <td style={{ padding: '12px' }}>
                  {product.is_available ? '✅ Доступен' : '❌ Недоступен'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => setEditingProduct(product)}
                      style={{ padding: '5px 10px' }}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="btn-danger" 
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{ padding: '5px 10px' }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <p style={{ textAlign: 'center', padding: '20px' }}>Нет товаров в системе</p>
      )}
    </div>
  );
};

export default AdminPanel;