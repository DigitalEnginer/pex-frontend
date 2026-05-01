import { useState, useEffect, useMemo } from 'react';
import api from './api';

export default function Dashboard({ token, user, setUser }) {
  const [stocks, setStocks] = useState([]);
  const [buyTicker, setBuyTicker] = useState('');
  const [buyShares, setBuyShares] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const { data } = await api.get('/stocks');
        setStocks(data);
      } catch (err) {
        console.error('Failed to fetch stocks', err);
      }
    };
    fetchStocks();
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws:///pex-backend-vtex.onrender.com', [token]);

    ws.onopen = () => console.log('WebSocket Connected');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'TICKER_UPDATE') {
        const { ticker, price } = message.payload;
        setStocks((prevStocks) => 
          prevStocks.map((stock) => 
            stock.ticker === ticker ? { ...stock, price } : stock
          )
        );
      } else if (message.type === 'NEW_TICKER') {
        setStocks((prevStocks) => {
          const exists = prevStocks.find(s => s._id === message.payload._id);
          if (exists) return prevStocks;
          return [...prevStocks, message.payload];
        });
      }
    };

    ws.onclose = () => console.log('WebSocket Disconnected');

    return () => ws.close();
  }, [token]);

  const valuation = useMemo(() => {
    let total = user?.walletBalance || 0;
    const holdings = user?.holdings || [];

    holdings.forEach((holding) => {
      const marketStock = stocks.find((s) => s.ticker === holding.ticker);
      const currentPrice = marketStock ? marketStock.price : 0;
      total += holding.shares * currentPrice;
    });

    return total;
  }, [user?.walletBalance, user?.holdings, stocks]);

  const myStock = stocks.find((s) => s.creator === user.id);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleCreateStock = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanTicker = newTicker.replace('$', '').toUpperCase();
    
    try {
      const { data } = await api.post('/stocks', { ticker: cleanTicker });
      setStocks((prevStocks) => {
        const exists = prevStocks.find(s => s._id === data._id);
        if (exists) return prevStocks;
        return [...prevStocks, data];
      });
      setNewTicker('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating stock');
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/stocks/${myStock._id}/price`, { price: newPrice });
      setNewPrice('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating price');
    }
  };

  const handleBuyStock = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanTicker = buyTicker.replace('$', '').toUpperCase();
    const qty = Number(buyShares);
    
    const targetStock = stocks.find(s => s.ticker === cleanTicker);
    
    if (!targetStock) {
      setError(`Stock '${cleanTicker}' not found on the market. Please check the ticker name.`);
      return;
    }
    
    const totalCost = targetStock.price * qty;
    if (totalCost > user.walletBalance) {
      setError(`Insufficient funds. You need ${formatMoney(totalCost)} to buy ${qty} shares of ${cleanTicker}, but you only have ${formatMoney(user.walletBalance)}.`);
      return;
    }

    try {
      const { data } = await api.post('/stocks/buy', { ticker: cleanTicker, shares: qty });
      setUser({ ...user, walletBalance: data.walletBalance, holdings: data.holdings });
      setBuyTicker('');
      setBuyShares('');
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Please try again.');
    }
  };

  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' };
  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem', fontSize: '0.95rem' };
  const buttonStyle = { width: '100%', padding: '0.75rem', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' };

  return (
    <div>
      {error && <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '1rem', marginBottom: '1.5rem', borderRadius: '6px', fontWeight: '500', lineHeight: '1.4' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ ...cardStyle, borderTop: '4px solid #10b981' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Wallet Balance</p>
          <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: 0, color: '#0f172a', letterSpacing: '-1px' }}>{formatMoney(user?.walletBalance || 0)}</h3>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #3b82f6' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Total Valuation</p>
          <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: 0, color: '#0f172a', letterSpacing: '-1px' }}>{formatMoney(valuation)}</h3>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #8b5cf6' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Active Trader</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 'auto 0 0 0', color: '#0f172a' }}>@{user?.username}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', color: '#0f172a' }}>Market Data</h2>
          {stocks.length === 0 ? <p style={{ color: '#64748b', fontStyle: 'italic' }}>Market is currently empty.</p> : (
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '10px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stocks.map((s) => (
                  <li key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569', fontSize: '0.8rem' }}>
                        {s.ticker.charAt(0)}
                      </div>
                      <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>${s.ticker}</strong>
                    </div>
                    <span style={{ fontWeight: '600', color: '#10b981', fontSize: '1.1rem' }}>{formatMoney(s.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ marginTop: 'auto' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Execute Trade</h3>
            <form onSubmit={handleBuyStock}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Ticker" 
                  value={buyTicker} 
                  onChange={(e) => {
                    setBuyTicker(e.target.value);
                    setError('');
                  }} 
                  required 
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }} 
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={buyShares} 
                  onChange={(e) => {
                    setBuyShares(e.target.value);
                    setError('');
                  }} 
                  required 
                  min="1" 
                  style={{ ...inputStyle, marginBottom: 0, width: '100px' }} 
                />
              </div>
              <button type="submit" style={{ ...buttonStyle, backgroundColor: '#2563eb' }}>Buy Shares</button>
            </form>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', color: '#0f172a' }}>My Portfolio</h2>
          {(!user?.holdings || user.holdings.length === 0) ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
              <p>You don't own any shares yet.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {user.holdings.map((h, i) => {
                const currentPrice = stocks.find(s => s.ticker === h.ticker)?.price || 0;
                return (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '1.1rem' }}>{h.ticker}</strong>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{h.shares} shares @ {formatMoney(currentPrice)}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatMoney(h.shares * currentPrice)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div style={{ ...cardStyle, backgroundColor: '#f8fafc' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', color: '#0f172a' }}>Company Management</h2>
          {!myStock ? (
            <form onSubmit={handleCreateStock} style={{ margin: 'auto 0' }}>
              <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: '1.5' }}>You haven't issued a stock yet. Create one to allow others to invest in your company.</p>
              <input 
                type="text" 
                placeholder="Desired Ticker (e.g. MYCO)" 
                value={newTicker} 
                onChange={(e) => {
                  setNewTicker(e.target.value);
                  setError('');
                }} 
                required 
                style={inputStyle} 
              />
              <button type="submit" style={buttonStyle}>Go Public (Issue Stock)</button>
            </form>
          ) : (
            <div style={{ margin: 'auto 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Your Ticker</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>${myStock.ticker}</span>
              </div>
              <form onSubmit={handleUpdatePrice}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Adjust Market Price</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter new price" 
                  value={newPrice} 
                  onChange={(e) => {
                    setNewPrice(e.target.value);
                    setError('');
                  }} 
                  required 
                  style={{ ...inputStyle, fontSize: '1.1rem', padding: '1rem' }} 
                />
                <button type="submit" style={buttonStyle}>Broadcast Price Update</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}