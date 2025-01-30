/************************************************************
 * frontend/src/pages/Accounts.jsx
 *
 * For Step #6:
 * - Calls GET /accounts/balances
 * - Displays each account in a "widget" table (like a card)
 ************************************************************/

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
      // e.g. [
      //   {
      //     account: "Coinbase",
      //     totalValue: 12000,
      //     breakdown: [
      //       { symbol: "BTC", quantity: 0.3, currentPrice: 26000, totalValue: 7800 },
      //       ...
      //     ]
      //   },
      //   ...
      // ]
      setBalances(data);
    } catch (err) {
      console.error('Error fetching account balances:', err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Accounts / Wallets</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {balances.length === 0 ? (
        <p>No accounts found or no data.</p>
      ) : (
        balances.map((acc) => (
          <div
            key={acc.account}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              marginBottom: '20px'
            }}
          >
            <h3>{acc.account}</h3>
            <p>
              <strong>Total Value:</strong> $
              {acc.totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #555' }}>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Current Price</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {acc.breakdown.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                    <td>{row.symbol}</td>
                    <td>{row.quantity}</td>
                    <td>
                      $
                      {row.currentPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td>
                      $
                      {row.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
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
