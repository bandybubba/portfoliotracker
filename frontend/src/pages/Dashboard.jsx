/************************************************************
 * frontend/src/pages/Dashboard.jsx
 *
 * Updated to use:
 *   - GET /portfolio => returns [{symbol, quantity, averageCost}, ...]
 *   - GET /portfolio-current => returns { totalValue, breakdown: [{symbol, quantity, currentPrice, totalValue}, ...] }
 *
 * No more "assetSymbol" references. We use "symbol" or "quantity" as returned by your new backend.
 ************************************************************/

import React, { useEffect, useState } from 'react';

function Dashboard() {
  // Cost basis data from /portfolio
  const [costBasis, setCostBasis] = useState([]);
  const [costBasisError, setCostBasisError] = useState('');

  // Real-time data from /portfolio-current
  const [realtimeData, setRealtimeData] = useState(null);
  const [realtimeError, setRealtimeError] = useState('');

  // Fetch both on mount
  useEffect(() => {
    fetchCostBasis();
    fetchRealtimeValue();
  }, []);

  const fetchCostBasis = async () => {
    try {
      const res = await fetch('http://localhost:3000/portfolio');
      if (!res.ok) {
        throw new Error(`Error fetching /portfolio: ${res.status}`);
      }
      const data = await res.json();
      setCostBasis(data); // e.g. [{symbol, quantity, averageCost}]
    } catch (err) {
      console.error('Cost basis fetch error:', err);
      setCostBasisError(err.message);
    }
  };

  const fetchRealtimeValue = async () => {
    try {
      const res = await fetch('http://localhost:3000/portfolio-current');
      if (!res.ok) {
        throw new Error(`Error fetching /portfolio-current: ${res.status}`);
      }
      const data = await res.json();
      // e.g. { totalValue: 12345, breakdown: [{ symbol, quantity, currentPrice, totalValue }, ...] }
      setRealtimeData(data);
    } catch (err) {
      console.error('Real-time fetch error:', err);
      setRealtimeError(err.message);
    }
  };

  const handleRefresh = () => {
    fetchCostBasis();
    fetchRealtimeValue();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <button onClick={handleRefresh} style={{ marginBottom: '20px' }}>
        Refresh
      </button>

      {/* SECTION: COST BASIS */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Cost Basis (Average Cost) from /portfolio</h3>
        {costBasisError && <p style={{ color: 'red' }}>{costBasisError}</p>}
        {costBasis.length === 0 ? (
          <p>No holdings found (cost basis).</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #555' }}>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Average Cost</th>
              </tr>
            </thead>
            <tbody>
              {costBasis.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                  <td>{item.symbol}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.averageCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SECTION: REAL-TIME VALUE */}
      <div>
        <h3>Real-Time Portfolio Value from /portfolio-current</h3>
        {realtimeError && <p style={{ color: 'red' }}>{realtimeError}</p>}
        {!realtimeData ? (
          <p>Loading real-time data...</p>
        ) : (
          <>
            <p>
              <strong>Total Value: </strong>$
              {realtimeData.totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>

            {realtimeData.breakdown && realtimeData.breakdown.length > 0 ? (
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
                  {realtimeData.breakdown.map((row, idx) => (
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
            ) : (
              <p>No symbols held in real-time view.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
