/************************************************************
 * frontend/src/pages/ImportCSV.jsx
 *
 * A page to upload a CSV file for transactions import.
 ************************************************************/
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
      formData.append('file', file); // must match "upload.single('file')" field name

      const res = await fetch('http://localhost:3000/transactions/import-csv', {
        method: 'POST',
        body: formData // send as multipart/form-data
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
    <div style={{ padding: 20 }}>
      <h2>Import Transactions via CSV</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Select CSV File: </label>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <button type="submit" className="btn-primary">Import CSV</button>
      </form>

      <p style={{ marginTop: '20px', color: '#666' }}>
        Make sure the CSV headers match the transaction fields:
        <br />
        <code>
          date,type,notes,account,fromSymbol,fromQuantity,fromPrice,toSymbol,toQuantity,toPrice,fromAccount,toAccount
        </code>
      </p>
    </div>
  );
}

export default ImportCSV;
