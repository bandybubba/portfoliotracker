import React, { useEffect, useState } from 'react';

function Snapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [error, setError] = useState('');
  const [snapshotDate, setSnapshotDate] = useState('');

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    try {
      const res = await fetch('http://localhost:3000/snapshots');
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setSnapshots(data);
    } catch (err) {
      console.error('Error fetching snapshots:', err);
      setError(err.message);
    }
  };

  const handleTakeSnapshotNow = async () => {
    try {
      const res = await fetch('http://localhost:3000/snapshot', {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      await res.json();
      fetchSnapshots();
    } catch (err) {
      console.error('Error taking snapshot now:', err);
      setError(err.message);
    }
  };

  const handleSnapshotOnDate = async (e) => {
    e.preventDefault();
    try {
      if (!snapshotDate) {
        return alert('Please select a date first');
      }
      const payload = { snapshotDate };
      const res = await fetch('http://localhost:3000/snapshot/date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      await res.json();
      setSnapshotDate('');
      fetchSnapshots();
    } catch (err) {
      console.error('Error taking snapshot by date:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Snapshots</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="dark-card" style={{ marginBottom: '20px' }}>
        <button onClick={handleTakeSnapshotNow} className="dark-btn" style={{ marginRight: '10px' }}>
          Take Snapshot Now
        </button>

        <form onSubmit={handleSnapshotOnDate} style={{ display: 'inline-block' }}>
          <label>Snapshot Date: </label>
          <input
            type="date"
            value={snapshotDate}
            onChange={(e) => setSnapshotDate(e.target.value)}
          />
          <button type="submit" className="dark-btn" style={{ marginLeft: '10px' }}>
            Snapshot On This Date
          </button>
        </form>
      </div>

      <div className="dark-card">
        <h3>Historical Snapshots</h3>
        <table className="dark-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.date}</td>
                <td>${(s.totalValue || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Snapshots;
