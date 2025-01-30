// frontend/src/pages/Snapshots.jsx
import React, { useEffect, useState } from 'react';

function Snapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [error, setError] = useState('');

  // For the "snapshot by date" form
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

  // "Take Snapshot Now" => POST /snapshot
  const handleTakeSnapshotNow = async () => {
    try {
      const res = await fetch('http://localhost:3000/snapshot', {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      console.log('Snapshot created:', data);
      fetchSnapshots(); // refresh list
    } catch (err) {
      console.error('Error taking snapshot now:', err);
      setError(err.message);
    }
  };

  // "Snapshot On Date" => POST /snapshot/date with { snapshotDate }
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
      const data = await res.json();
      console.log('Snapshot on date created:', data);
      setSnapshotDate(''); // clear form
      fetchSnapshots();
    } catch (err) {
      console.error('Error taking snapshot by date:', err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '10px' }}>
      <h2>Historical Snapshots</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Button for "Take Snapshot Now" */}
      <button onClick={handleTakeSnapshotNow} style={{ marginBottom: '20px' }}>
        Take Snapshot Now
      </button>

      {/* Form for "Snapshot As Of Date" */}
      <form onSubmit={handleSnapshotOnDate} style={{ marginBottom: '20px' }}>
        <label>Snapshot Date: </label>
        <input
          type="date"
          value={snapshotDate}
          onChange={(e) => setSnapshotDate(e.target.value)}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>
          Snapshot On This Date
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #555' }}>
            <th>ID</th>
            <th>Date</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td>{s.id}</td>
              <td>{s.date}</td>
              <td>
                {s.totalValue?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Snapshots;
