import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

function Dashboard() {
  // Cost basis data from /portfolio
  const [costBasis, setCostBasis] = useState([]);
  const [costBasisError, setCostBasisError] = useState('');

  // Real-time data from /portfolio-current
  const [realtimeData, setRealtimeData] = useState(null);
  const [realtimeError, setRealtimeError] = useState('');

  // Example chart data
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchCostBasis();
    fetchRealtimeValue();

    // sample chart data
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
      setCostBasis(data);
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

  // approximate balance from costBasis
  let approximateBalance = 0;
  costBasis.forEach(item => {
    approximateBalance += item.quantity * item.averageCost;
  });

  return (
    <div>
      {/* Page Title */}
      <h1 style={{ marginBottom: '20px' }}>Portfolio</h1>

      {/* ROW: Left has big chart + assets, right has performance, etc. */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* LEFT COLUMN */}
        <div style={{ flex: 2 }}>
          {/* Big chart card */}
          <div className="dark-card" style={{ marginBottom: '20px' }}>
            <h3>Portfolio Balance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${approximateBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            {chartData ? (
              <div style={{ height: '300px' }}>
                <Line data={chartData} />
              </div>
            ) : (
              <p>Loading chart...</p>
            )}
          </div>

          {/* "Your assets" or Cost Basis card */}
          <div className="dark-card">
            <h3>Your assets</h3>
            {costBasisError && <p style={{ color: 'red' }}>{costBasisError}</p>}
            {costBasis.length === 0 ? (
              <p>No holdings found.</p>
            ) : (
              <table className="dark-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Avg Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {costBasis.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.symbol}</td>
                      <td>{item.quantity.toFixed(4)}</td>
                      <td>
                        $
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
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1 }}>
          {/* Example: All time performance card */}
          <div className="dark-card" style={{ marginBottom: '20px' }}>
            <h3>All time performance</h3>
            {/* If you want to incorporate /performance data, do so here */}
            <p>Unrealized return: ???</p>
            <p>Cost basis: ???</p>
          </div>

          {/* Example: Tax summary card */}
          <div className="dark-card">
            <h3>Tax summary</h3>
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Tax year</th>
                  <th>Gains</th>
                  <th>Income</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2025</td>
                  <td>+$4,217</td>
                  <td>$6</td>
                </tr>
                <tr>
                  <td>2024</td>
                  <td>-$13,338</td>
                  <td>$13</td>
                </tr>
                <tr>
                  <td>2023</td>
                  <td>-$682</td>
                  <td>$1</td>
                </tr>
                <tr>
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                </tr>
              </tbody>
            </table>
            <button className="dark-btn" style={{ marginTop: '10px' }}>
              Download tax reports
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME Value (optional) if you want it shown below */}
      <button onClick={handleRefresh} className="dark-btn" style={{ margin: '20px 0' }}>
        Refresh Data
      </button>
      <div className="dark-card">
        <h3>Real-Time Portfolio Value</h3>
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
