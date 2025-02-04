import React, { useEffect, useState } from 'react';
import '../DarkStyles.css';

function ManualBalances() {
  const [balances, setBalances] = useState([]);
  const [error, setError] = useState('');

  // fields
  const [account, setAccount] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchRawBalances(), fetchOverview()]);
  };

  const fetchRawBalances = async () => {
    try {
      const res = await fetch('http://localhost:3000/manual-balances');
      if (!res.ok) throw new Error(`Error listing: ${res.status}`);
      const data = await res.json();
      setBalances(data);
    } catch (err) {
      console.error('fetchRawBalances error:', err);
      setError(err.message);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('http://localhost:3000/manual-balances-overview');
      if (!res.ok) throw new Error(`Error overview: ${res.status}`);
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error('fetchOverview error:', err);
      setOverviewError(err.message);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        account,
        symbol,
        quantity: parseFloat(quantity) || 0,
        notes
      };
      const res = await fetch('http://localhost:3000/manual-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Error add: ${res.status}`);
      }
      await res.json();
      // clear form
      setAccount('');
      setSymbol('');
      setQuantity('');
      setNotes('');
      fetchAll();
    } catch (err) {
      console.error('Add manual balance error:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this manual balance?')) return;
    try {
      const res = await fetch(`http://localhost:3000/manual-balances/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Delete error: ${res.status}`);
      await res.json();
      fetchAll();
    } catch (err) {
      console.error('Delete manual balance error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="dark-page">
      <h1>Manual Balances (Banks, Stocks, Etc.)</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="dark-card" style={{ marginBottom: '20px' }}>
        <h3>Add Manual Balance Entry</h3>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: '8px' }}>
            <label>Account: </label>
            <input
              type="text"
              value={account}
              onChange={e => setAccount(e.target.value)}
              placeholder="e.g. ChaseBank or Fidelity"
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Symbol: </label>
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="e.g. AAPL, USD, BTC"
              required
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Quantity: </label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Notes: </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <button type="submit" className="dark-btn">Add</button>
        </form>
      </div>

      <div className="dark-card">
        <h3>Stored Manual Entries</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <table className="dark-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Account</th>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(b => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.account}</td>
                  <td>{b.symbol}</td>
                  <td>{b.quantity}</td>
                  <td>{b.notes}</td>
                  <td>
                    <button className="dark-btn" onClick={() => handleDelete(b.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dark-card">
        <h3>Overview: By Account / By Symbol</h3>
        {overviewError && <p style={{ color: 'red' }}>{overviewError}</p>}
        {!overview ? (
          <p>Loading overview...</p>
        ) : (
          <>
            <p>
              <strong>Total Value:</strong> $
              {overview.totalValue?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>

            <h4>By Account</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
              <table className="dark-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Total Value</th>
                    <th>Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.byAccount.map((acct, idx) => (
                    <tr key={idx}>
                      <td>{acct.account}</td>
                      <td>
                        $
                        {acct.totalValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td>
                        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                          <table className="dark-table">
                            <thead>
                              <tr>
                                <th>Symbol</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {acct.breakdown.map((item, i2) => (
                                <tr key={i2}>
                                  <td>{item.symbol}</td>
                                  <td>{item.quantity.toFixed(4)}</td>
                                  <td>${item.currentPrice.toFixed(2)}</td>
                                  <td>${item.totalValue.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4>By Symbol</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="dark-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Total Quantity</th>
                    <th>Current Price</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.bySymbol.map((sym, idx) => (
                    <tr key={idx}>
                      <td>{sym.symbol}</td>
                      <td>{sym.totalQuantity.toFixed(4)}</td>
                      <td>${sym.currentPrice.toFixed(2)}</td>
                      <td>${sym.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ManualBalances;
