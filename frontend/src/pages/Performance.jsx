// frontend/src/pages/Performance.jsx
import React, { useEffect, useState } from 'react';

function Performance() {
  const [perf, setPerf] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await fetch('http://localhost:3000/performance');
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setPerf(data);
    } catch (err) {
      console.error('Performance fetch error:', err);
      setError(err.message);
    }
  };

  if (error) {
    return <div style={{ padding: 20 }}>Error: {error}</div>;
  }
  if (!perf) {
    return <div style={{ padding: 20 }}>Loading performance data...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Performance Over Time</h2>
      <p>Latest Value: ${perf.latestValue?.toFixed(2)}</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #555' }}>
            <th>Interval</th>
            <th>Change</th>
            <th>Change %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>24h</td>
            <td>
              {perf.dayChange !== null
                ? `$${perf.dayChange.toFixed(2)}`
                : 'No data'}
            </td>
            <td>
              {perf.dayChangePercent !== null
                ? `${perf.dayChangePercent.toFixed(2)}%`
                : 'No data'}
            </td>
          </tr>
          <tr>
            <td>7d</td>
            <td>
              {perf.weekChange !== null
                ? `$${perf.weekChange.toFixed(2)}`
                : 'No data'}
            </td>
            <td>
              {perf.weekChangePercent !== null
                ? `${perf.weekChangePercent.toFixed(2)}%`
                : 'No data'}
            </td>
          </tr>
          <tr>
            <td>30d</td>
            <td>
              {perf.monthChange !== null
                ? `$${perf.monthChange.toFixed(2)}`
                : 'No data'}
            </td>
            <td>
              {perf.monthChangePercent !== null
                ? `${perf.monthChangePercent.toFixed(2)}%`
                : 'No data'}
            </td>
          </tr>
          <tr>
            <td>365d</td>
            <td>
              {perf.yearChange !== null
                ? `$${perf.yearChange.toFixed(2)}`
                : 'No data'}
            </td>
            <td>
              {perf.yearChangePercent !== null
                ? `${perf.yearChangePercent.toFixed(2)}%`
                : 'No data'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Performance;
