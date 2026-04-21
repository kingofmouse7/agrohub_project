import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    role: 'buyer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password2) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <button 
        onClick={() => navigate('/')} 
        className="btn-outline" 
        style={{ marginBottom: '20px' }}
      >
        ← На главную
      </button>
      
      <h2 className="form-title">Регистрация в Agrohub</h2>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя пользователя *</label>
          <input 
            type="text" 
            name="username"
            value={formData.username} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email} 
            onChange={handleChange} 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Пароль *</label>
          <input 
            type="password" 
            name="password"
            value={formData.password} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Подтверждение пароля *</label>
          <input 
            type="password" 
            name="password2"
            value={formData.password2} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Роль</label>
          <select 
            name="role"
            value={formData.role} 
            onChange={handleChange}
            disabled={loading}
          >
            <option value="buyer">Покупатель</option>
            <option value="seller">Продавец</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      
      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
};

export default Register;