/************************************************************
 * src/pages/Dashboard.jsx
 *
 * A stylized Dashboard with:
 *  - A "Balance" card
 *  - A chart using react-chartjs-2
 *  - A holdings table
 *  - A tax summary card
 ************************************************************/
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [assets, setAssets] = useState([]);

  // Example: fetch or compute data
  useEffect(() => {
    // Suppose we call /portfolio to get cost basis
    fetchPortfolio();
    // We also set up some placeholder chart data
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

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('http://localhost:3000/portfolio');
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      // data is an array of { symbol, quantity, averageCost }
      setAssets(data);
      // Example: sum up some "balance"
      // This might differ from real-time /portfolio-current
      let total = 0;
      data.forEach(item => {
        total += item.quantity * item.averageCost;
      });
      setBalance(total);
    } catch (err) {
      console.error('fetchPortfolio error:', err);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>

      {/* BALANCE & CHART */}
      <div className="dark-card" style={{ marginBottom: '20px' }}>
        <h3>Portfolio Balance</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>${balance.toLocaleString()}</p>
        {/* CHART */}
        {chartData ? (
          <div className="chart-container">
            <Line data={chartData} />
          </div>
        ) : (
          <p>Loading chart...</p>
        )}
      </div>

      {/* ASSETS TABLE */}
      <div className="dark-card">
        <div className="dark-card-header">Your Assets</div>
        <table className="dark-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Avg Cost</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr key={idx}>
                <td>{asset.symbol}</td>
                <td>{asset.quantity.toFixed(4)}</td>
                <td>${asset.averageCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TAX SUMMARY (example) */}
      <div className="dark-card">
        <div className="dark-card-header">Tax Summary</div>
        <p>2025 Gains: $-9,636</p>
        <p>2024 Gains: $679</p>
        <button className="dark-btn">Download Tax Reports</button>
      </div>
    </div>
  );
}

export default Dashboard;
