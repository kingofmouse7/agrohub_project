import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Неверное имя пользователя или пароль');
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
      
      <h2 className="form-title">Вход в Agrohub</h2>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя пользователя</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Пароль</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      
      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
};

export default Login;