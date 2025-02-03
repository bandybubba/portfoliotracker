import React, { useEffect, useState } from 'react';

function Accounts() {
  const [balances, setBalances] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const res = await fetch('http://localhost:3000/accounts/balances');
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setBalances(data);
    } catch (err) {
      console.error('Error fetching account balances:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Accounts</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {balances.length === 0 ? (
        <p>No accounts found or no data.</p>
      ) : (
        balances.map((acc, idx) => (
          <div className="dark-card" key={idx}>
            <h3>{acc.account}</h3>
            <p><strong>Total Value:</strong> ${acc.totalValue.toFixed(2)}</p>
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Current Price</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {acc.breakdown.map((row, i2) => (
                  <tr key={i2}>
                    <td>{row.symbol}</td>
                    <td>{row.quantity.toFixed(4)}</td>
                    <td>${row.currentPrice.toFixed(2)}</td>
                    <td>${row.totalValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default Accounts;
