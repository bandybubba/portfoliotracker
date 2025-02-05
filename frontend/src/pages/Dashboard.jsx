import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

function Dashboard() {
  // Transaction-based cost basis
  const [costBasis, setCostBasis] = useState([]);
  const [costBasisError, setCostBasisError] = useState('');

  // Transaction-based real-time
  const [realtimeData, setRealtimeData] = useState(null);
  const [realtimeError, setRealtimeError] = useState('');

  // Manual balances overview
  const [manualOverview, setManualOverview] = useState(null);
  const [manualError, setManualError] = useState('');

  // Chart
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchCostBasis();
    fetchRealtimeValue();
    fetchManualOverview();

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

  const fetchManualOverview = async () => {
    try {
      const res = await fetch('http://localhost:3000/manual-balances-overview');
      if (!res.ok) {
        throw new Error(`Error fetching manual balances overview: ${res.status}`);
      }
      const data = await res.json();
      setManualOverview(data);
    } catch (err) {
      console.error('Manual balances fetch error:', err);
      setManualError(err.message);
    }
  };

  const handleRefresh = () => {
    fetchCostBasis();
    fetchRealtimeValue();
    fetchManualOverview();
  };

  // Transaction-based approximate
  let approximateBalance = 0;
  costBasis.forEach(item => {
    approximateBalance += item.quantity * item.averageCost;
  });
  // Manual total
  let manualTotal = 0;
  if (manualOverview && manualOverview.totalValue) {
    manualTotal = manualOverview.totalValue;
  }
  // Combined cost-basis
  const combinedPortfolioValue = approximateBalance + manualTotal;

  // Real-time transaction-based
  let txRealTimeValue = 0;
  if (realtimeData && realtimeData.totalValue) {
    txRealTimeValue = realtimeData.totalValue;
  }
  // We'll pretend manualRealTime = manualTotal
  const combinedRealTimeValue = txRealTimeValue + manualTotal;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      {manualError && <p style={{ color: 'red' }}>{manualError}</p>}

      <button onClick={handleRefresh} className="dark-btn refresh-btn">
        Refresh
      </button>

      <div className="two-col-row">
        {/* LEFT COLUMN */}
        <div className="col">
          <div className="dark-card">
            <h3>Portfolio Balance (Combined)</h3>
            <p className="big-portfolio-balance">
              ${combinedPortfolioValue.toLocaleString(undefined, {
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

          <div className="dark-card">
            <h3>Cost Basis (Avg Cost)</h3>
            {costBasisError && <p style={{ color: 'red' }}>{costBasisError}</p>}
            {costBasis.length === 0 ? (
              <p>No holdings found (transactions side).</p>
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

          <div className="dark-card">
            <h3>Manual Balances Overview</h3>
            {!manualOverview ? (
              <p>Loading manual balances...</p>
            ) : (
              <>
                <p>
                  <strong>Total Manual Value:</strong>{' '}
                  ${manualOverview.totalValue?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col">
          <div className="dark-card">
            <h3>Real-Time Value (Combined)</h3>
            {realtimeError && <p style={{ color: 'red' }}>{realtimeError}</p>}
            {!realtimeData ? (
              <p>Loading real-time data...</p>
            ) : (
              <>
                <p>
                  <strong>Total Value: </strong>$
                  {combinedRealTimeValue.toLocaleString(undefined, {
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
                  <p>No symbols in transactions real-time data.</p>
                )}
              </>
            )}
          </div>

          <div className="dark-card">
            <h3>Performance / Tax Summary</h3>
            <p>All-time gain: ???</p>
            <p>Cost basis: ???</p>
            <button className="dark-btn">View More</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
