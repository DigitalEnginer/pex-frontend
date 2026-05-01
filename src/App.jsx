import { useState } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Auth setToken={setToken} setUser={setUser} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>P</div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', letterSpacing: '-0.5px' }}>Personal Exchange</h1>
        </div>
        <button onClick={logout} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}>
          Sign Out
        </button>
      </header>
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Dashboard token={token} user={user} setUser={setUser} />
      </main>
    </div>
  );
}