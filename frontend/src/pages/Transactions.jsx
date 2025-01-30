/************************************************************
 * frontend/src/pages/Transactions.jsx
 *
 * Example usage of "styles.css" classes for a more professional look:
 * - .custom-table
 * - .btn-primary
 * - .select-type
 * - color-coded transaction types
 ************************************************************/
import React, { useEffect, useState } from 'react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  // Form fields
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

      // Clear form
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

  // Color-coded classes for each type
  const getTypeClass = (t) => {
    switch (t.toLowerCase()) {
      case 'buy': return 'type-buy';
      case 'sell': return 'type-sell';
      case 'swap': return 'type-swap';
      case 'transfer': return 'type-transfer';
      default: return '';
    }
  };

  return (
    <div>
      <h2>Transactions</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="card">
        <div className="card-header">Add New Transaction</div>
        <div className="card-body">
          <form onSubmit={handleAddTransaction}>
            <div className="mb-2">
              <label>Date: </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="mb-2">
              <label>Type: </label>
              <select
                className="select-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">-- Select --</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="swap">Swap</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="mb-2">
              <label>Notes: </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Example: if type != transfer, show "account" field */}
            {type.toLowerCase() !== 'transfer' && (
              <div className="mb-2">
                <label>Account: </label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
            )}

            {/* For transfer, show fromAccount/toAccount */}
            {type.toLowerCase() === 'transfer' && (
              <>
                <div className="mb-2">
                  <label>From Account: </label>
                  <input
                    type="text"
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label>To Account: </label>
                  <input
                    type="text"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="mb-2">
              <label>From Symbol: </label>
              <input
                type="text"
                value={fromSymbol}
                onChange={(e) => setFromSymbol(e.target.value)}
                required
              />
            </div>
            <div className="mb-2">
              <label>From Quantity: </label>
              <input
                type="number"
                step="any"
                value={fromQuantity}
                onChange={(e) => setFromQuantity(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label>From Price: </label>
              <input
                type="number"
                step="any"
                value={fromPrice}
                onChange={(e) => setFromPrice(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label>To Symbol: </label>
              <input
                type="text"
                value={toSymbol}
                onChange={(e) => setToSymbol(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label>To Quantity: </label>
              <input
                type="number"
                step="any"
                value={toQuantity}
                onChange={(e) => setToQuantity(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label>To Price: </label>
              <input
                type="number"
                step="any"
                value={toPrice}
                onChange={(e) => setToPrice(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary">Add Transaction</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">All Transactions</div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Notes</th>
                <th>Account</th>
                <th>From Account</th>
                <th>To Account</th>
                <th>From Symbol</th>
                <th>From Qty</th>
                <th>From Price</th>
                <th>To Symbol</th>
                <th>To Qty</th>
                <th>To Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const typeClass = getTypeClass(tx.type || '');
                return (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{tx.date}</td>
                    <td>
                      <span className={typeClass}>
                        {tx.type}
                      </span>
                    </td>
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
    </div>
  );
}

export default Transactions;
