/************************************************************
 * Dashboard.jsx - Merged FULL Code 
 *   - cost basis from /portfolio
 *   - real-time from /portfolio-current
 *   - chart using react-chartjs-2
 ************************************************************/
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

// This merges your old cost-basis & real-time logic 
// plus the chart example.

function Dashboard() {
  // Cost basis data from /portfolio
  const [costBasis, setCostBasis] = useState([]);
  const [costBasisError, setCostBasisError] = useState('');

  // Real-time data from /portfolio-current
  const [realtimeData, setRealtimeData] = useState(null);
  const [realtimeError, setRealtimeError] = useState('');

  // Example chart data
  const [chartData, setChartData] = useState(null);

  // On mount, fetch cost-basis & real-time
  useEffect(() => {
    fetchCostBasis();
    fetchRealtimeValue();

    // Provide some sample chart data (like your previous example)
    const sampleLabels = ['Jan 24','Jan 25','Jan 26','Jan 27','Jan 28','Jan 29','Jan 30'];
    const sampleValues = [60000, 58000, 59000, 57000, 56500, 58000, 59686];
    setChartData({
      labels: sampleLabels,
      datasets: [
        {
          label: 'Balance (demo)',
          data: sampleValues,
          borderColor: '#A09EF7',
          backgroundColor: 'rgba(160,158,247,0.2)',
          tension: 0.2,
          fill: true
        }
      ]
    });
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

  // We'll also compute a "balance" for demonstration from costBasis
  // or from realTime. Up to you.
  let approximateBalance = 0;
  costBasis.forEach(item => {
    approximateBalance += item.quantity * item.averageCost;
  });

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>
      
      <button onClick={handleRefresh} className="dark-btn" style={{ marginBottom: '20px' }}>
        Refresh
      </button>

      {/* TOP CARD with chart */}
      <div className="dark-card" style={{ marginBottom: '20px' }}>
        <h3>Portfolio Balance</h3>
        {/* approximateBalance from cost basis */}
        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          ${approximateBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
        {chartData ? (
          <div className="chart-container">
            <Line data={chartData} />
          </div>
        ) : (
          <p>Loading chart...</p>
        )}
      </div>

      {/* COST BASIS TABLE */}
      <div className="dark-card" style={{ marginBottom: '40px' }}>
        <h3>Cost Basis (Average Cost) from /portfolio</h3>
        {costBasisError && <p style={{ color: 'red' }}>{costBasisError}</p>}
        {costBasis.length === 0 ? (
          <p>No holdings found (cost basis).</p>
        ) : (
          <table className="dark-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Quantity</th>
                <th>Average Cost</th>
              </tr>
            </thead>
            <tbody>
              {costBasis.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.symbol}</td>
                  <td>{item.quantity.toFixed(4)}</td>
                  <td>
                    ${item.averageCost.toLocaleString(undefined, {
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

      {/* REAL-TIME VALUE */}
      <div className="dark-card">
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
                  {realtimeData.breakdown.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.symbol}</td>
                      <td>{row.quantity.toFixed(4)}</td>
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
