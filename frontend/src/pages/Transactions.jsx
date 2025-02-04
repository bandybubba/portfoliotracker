import React, { useEffect, useState } from 'react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [account, setAccount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [fromSymbol, setFromSymbol] = useState('');
  const [fromQuantity, setFromQuantity] = useState('');
  const [fromPrice, setFromPrice] = useState('');
  const [toSymbol, setToSymbol] = useState('');
  const [toQuantity, setToQuantity] = useState('');
  const [toPrice, setToPrice] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://localhost:3000/transactions');
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setTransactions(data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date,
        type,
        notes,
        account,
        fromSymbol,
        fromQuantity: parseFloat(fromQuantity) || 0,
        fromPrice: parseFloat(fromPrice) || 0,
        toSymbol,
        toQuantity: parseFloat(toQuantity) || 0,
        toPrice: parseFloat(toPrice) || 0,
        fromAccount,
        toAccount
      };

      const res = await fetch('http://localhost:3000/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      // clear form
      setDate('');
      setType('');
      setNotes('');
      setAccount('');
      setFromAccount('');
      setToAccount('');
      setFromSymbol('');
      setFromQuantity('');
      setFromPrice('');
      setToSymbol('');
      setToQuantity('');
      setToPrice('');

      fetchTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err.message);
    }
  };

  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      if (!selectedIds.length) {
        alert('No transactions selected');
        return;
      }
      const confirmDelete = window.confirm('Delete selected transactions?');
      if (!confirmDelete) return;

      const res = await fetch('http://localhost:3000/transactions/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      await res.json();
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting selected:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Transactions</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Add Transaction Form */}
      <div className="dark-card" style={{ marginBottom: '20px' }}>
        <h3>Add New Transaction</h3>
        <form onSubmit={handleAddTransaction}>
          <div style={{ marginBottom: '8px' }}>
            <label>Date: </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Type: </label>
            <select value={type} onChange={e => setType(e.target.value)} required>
              <option value="">--Select--</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="swap">Swap</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Notes: </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {type.toLowerCase() !== 'transfer' && (
            <div style={{ marginBottom: '8px' }}>
              <label>Account: </label>
              <input
                type="text"
                value={account}
                onChange={e => setAccount(e.target.value)}
              />
            </div>
          )}

          {type.toLowerCase() === 'transfer' && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <label>From Account: </label>
                <input
                  type="text"
                  value={fromAccount}
                  onChange={e => setFromAccount(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label>To Account: </label>
                <input
                  type="text"
                  value={toAccount}
                  onChange={e => setToAccount(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '8px' }}>
            <label>From Symbol: </label>
            <input
              type="text"
              value={fromSymbol}
              onChange={e => setFromSymbol(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>From Quantity: </label>
            <input
              type="number"
              step="any"
              value={fromQuantity}
              onChange={e => setFromQuantity(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>From Price: </label>
            <input
              type="number"
              step="any"
              value={fromPrice}
              onChange={e => setFromPrice(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label>To Symbol: </label>
            <input
              type="text"
              value={toSymbol}
              onChange={e => setToSymbol(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>To Quantity: </label>
            <input
              type="number"
              step="any"
              value={toQuantity}
              onChange={e => setToQuantity(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>To Price: </label>
            <input
              type="number"
              step="any"
              value={toPrice}
              onChange={e => setToPrice(e.target.value)}
            />
          </div>

          <button type="submit" className="dark-btn">Add Transaction</button>
        </form>
      </div>

      {/* Delete Selected */}
      <button onClick={handleDeleteSelected} className="dark-btn" style={{ marginBottom: '20px' }}>
        Delete Selected
      </button>

      {/* Transactions Table */}
      <div className="dark-card">
        <h3>All Transactions</h3>
        <table className="dark-table">
          <thead>
            <tr>
              <th></th> {/* checkboxes */}
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Notes</th>
              <th>Account</th>
              <th>FromAccount</th>
              <th>ToAccount</th>
              <th>FromSymbol</th>
              <th>FromQty</th>
              <th>FromPrice</th>
              <th>ToSymbol</th>
              <th>ToQty</th>
              <th>ToPrice</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => {
              const checked = selectedIds.includes(tx.id);
              return (
                <tr key={tx.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleCheckboxChange(tx.id, e.target.checked)}
                    />
                  </td>
                  <td>{tx.id}</td>
                  <td>{tx.date}</td>
                  <td>{tx.type}</td>
                  <td>{tx.notes}</td>
                  <td>{tx.account}</td>
                  <td>{tx.fromAccount}</td>
                  <td>{tx.toAccount}</td>
                  <td>{tx.fromSymbol}</td>
                  <td>{tx.fromQuantity}</td>
                  <td>{tx.fromPrice}</td>
                  <td>{tx.toSymbol}</td>
                  <td>{tx.toQuantity}</td>
                  <td>{tx.toPrice}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transactions;
