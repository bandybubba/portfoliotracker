import React, { useState } from 'react';

function ImportCSV() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:3000/transactions/import-csv', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error(`Error importing CSV: ${res.status}`);
      }
      const data = await res.json();
      setMessage(`Imported ${data.inserted} transactions successfully!`);
    } catch (err) {
      console.error('CSV import error:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Import CSV</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'lime' }}>{message}</p>}

      <div className="dark-card">
        <h3>Upload Your CSV</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Select CSV File: </label>
            <input type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          <button type="submit" className="dark-btn">Import CSV</button>
        </form>
      </div>
    </div>
  );
}

export default ImportCSV;
