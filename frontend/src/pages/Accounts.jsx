import React, { useEffect, useState } from 'react';

function Accounts() {
  // Combined array of accounts after merging transaction & manual
  const [accountsData, setAccountsData] = useState([]);
  const [error, setError] = useState('');

  // Expand/collapse state
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchAndMergeAccounts();
  }, []);

  const fetchAndMergeAccounts = async () => {
    try {
      // Transaction-based
      const txRes = await fetch('http://localhost:3000/accounts/balances');
      if (!txRes.ok) {
        throw new Error(`Transaction accounts error: ${txRes.status}`);
      }
      const txData = await txRes.json();

      // Manual-based => /manual-balances-overview => byAccount
      const manualRes = await fetch('http://localhost:3000/manual-balances-overview');
      if (!manualRes.ok) {
        throw new Error(`Manual balances overview error: ${manualRes.status}`);
      }
      const manualData = await manualRes.json();

      // unify
      const mergedMap = {};
      // 1) TX
      txData.forEach(txAcc => {
        const accName = txAcc.account || 'UnnamedTx';
        mergedMap[accName] = {
          account: accName,
          txValue: txAcc.totalValue || 0,
          txBreakdown: txAcc.breakdown || [],
          manualValue: 0,
          manualBreakdown: [],
        };
      });
      // 2) Manual
      if (manualData && manualData.byAccount) {
        manualData.byAccount.forEach(mAcc => {
          const accName = mAcc.account || 'UnnamedManual';
          if (!mergedMap[accName]) {
            mergedMap[accName] = {
              account: accName,
              txValue: 0,
              txBreakdown: [],
              manualValue: mAcc.totalValue || 0,
              manualBreakdown: mAcc.breakdown || [],
            };
          } else {
            mergedMap[accName].manualValue = mAcc.totalValue || 0;
            mergedMap[accName].manualBreakdown = mAcc.breakdown || [];
          }
        });
      }

      const mergedAccounts = Object.values(mergedMap).map(item => ({
        ...item,
        combinedValue: item.txValue + item.manualValue
      }));

      // sort descending
      mergedAccounts.sort((a,b) => b.combinedValue - a.combinedValue);

      setAccountsData(mergedAccounts);
    } catch (err) {
      console.error('fetchAndMergeAccounts error:', err);
      setError(err.message);
    }
  };

  const toggleExpand = (accName) => {
    setExpanded(prev => ({
      ...prev,
      [accName]: !prev[accName]
    }));
  };

  // If you want to display them in two columns, split the array
  const halfIndex = Math.ceil(accountsData.length / 2);
  const leftAccounts = accountsData.slice(0, halfIndex);
  const rightAccounts = accountsData.slice(halfIndex);

  return (
    <div className="dark-container">
      <h1 className="page-title">Accounts (Merged Transaction + Manual)</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="two-col-row">
        {/* LEFT COLUMN -> half the accounts */}
        <div className="col">
          {leftAccounts.length === 0 ? (
            <div className="dark-card">
              <p>No accounts in left column.</p>
            </div>
          ) : (
            leftAccounts.map((accItem, idx) => {
              const isExpanded = expanded[accItem.account] || false;
              return (
                <div className="dark-card" key={idx}>
                  <h3>{accItem.account}</h3>
                  <p><strong>Combined Value:</strong> ${accItem.combinedValue.toFixed(2)}</p>
                  <button className="dark-btn" onClick={() => toggleExpand(accItem.account)}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: '10px' }}>
                      {/* Transaction side */}
                      <h4>Transaction Balances</h4>
                      <p><strong>Total Tx Value:</strong> ${accItem.txValue.toFixed(2)}</p>
                      {accItem.txBreakdown.length > 0 ? (
                        <table className="dark-table" style={{ marginBottom: '20px' }}>
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accItem.txBreakdown.map((row, i2) => (
                              <tr key={i2}>
                                <td>{row.symbol}</td>
                                <td>{row.quantity.toFixed(4)}</td>
                                <td>${row.currentPrice.toFixed(2)}</td>
                                <td>${row.totalValue.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No transaction-based assets here.</p>
                      )}

                      {/* Manual side */}
                      <h4>Manual Balances</h4>
                      <p><strong>Total Manual Value:</strong> ${accItem.manualValue.toFixed(2)}</p>
                      {accItem.manualBreakdown.length > 0 ? (
                        <table className="dark-table">
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accItem.manualBreakdown.map((row, i3) => (
                              <tr key={i3}>
                                <td>{row.symbol}</td>
                                <td>{row.quantity.toFixed(4)}</td>
                                <td>${row.currentPrice.toFixed(2)}</td>
                                <td>${row.totalValue.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No manual entries for this account.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN -> other half of accounts */}
        <div className="col">
          {rightAccounts.length === 0 ? (
            <div className="dark-card">
              <p>No accounts in right column.</p>
            </div>
          ) : (
            rightAccounts.map((accItem, idx) => {
              const isExpanded = expanded[accItem.account] || false;
              return (
                <div className="dark-card" key={idx}>
                  <h3>{accItem.account}</h3>
                  <p><strong>Combined Value:</strong> ${accItem.combinedValue.toFixed(2)}</p>
                  <button className="dark-btn" onClick={() => toggleExpand(accItem.account)}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: '10px' }}>
                      <h4>Transaction Balances</h4>
                      <p><strong>Total Tx Value:</strong> ${accItem.txValue.toFixed(2)}</p>
                      {accItem.txBreakdown.length > 0 ? (
                        <table className="dark-table" style={{ marginBottom: '20px' }}>
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accItem.txBreakdown.map((row, i2) => (
                              <tr key={i2}>
                                <td>{row.symbol}</td>
                                <td>{row.quantity.toFixed(4)}</td>
                                <td>${row.currentPrice.toFixed(2)}</td>
                                <td>${row.totalValue.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No transaction-based assets here.</p>
                      )}

                      <h4>Manual Balances</h4>
                      <p><strong>Total Manual Value:</strong> ${accItem.manualValue.toFixed(2)}</p>
                      {accItem.manualBreakdown.length > 0 ? (
                        <table className="dark-table">
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accItem.manualBreakdown.map((row, i3) => (
                              <tr key={i3}>
                                <td>{row.symbol}</td>
                                <td>{row.quantity.toFixed(4)}</td>
                                <td>${row.currentPrice.toFixed(2)}</td>
                                <td>${row.totalValue.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No manual entries for this account.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Accounts;
