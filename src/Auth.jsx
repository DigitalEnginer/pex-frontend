import { useState } from 'react';
import api from './api';

export default function Auth({ setToken, setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return false;
    }
    
    if (!isLogin) {
      if (username.length < 3) {
        setError('Username must be at least 3 characters long.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { username, password });
      
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user)); 
      
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'A network error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem', margin: '0 auto 1rem auto' }}>P</div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.95rem' }}>The Personal Exchange Terminal</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '1rem', marginBottom: '1.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => {
                setUsername(e.target.value);
                setError(''); 
              }} 
              style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: error && username.length === 0 ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', transition: 'border-color 0.2s' }} 
              placeholder="e.g. trader1"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }} 
              style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: error && password.length === 0 ? '1px solid #ef4444' : '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', transition: 'border-color 0.2s' }} 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '0.875rem', 
              backgroundColor: isLoading ? '#94a3b8' : '#2563eb', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '1rem', 
              fontWeight: '600', 
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              marginTop: '0.5rem', 
              transition: 'background-color 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In to Trade' : 'Open Account')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setUsername('');
              setPassword('');
            }} 
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span style={{ color: '#2563eb' }}>{isLogin ? 'Sign up' : 'Log in'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}