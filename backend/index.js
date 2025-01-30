/***************************************************************
 * backend/index.js
 *
 * 1) from->to transactions with fromPrice/toPrice
 * 2) /portfolio, /portfolio-current
 * 3) Snapshots (both "today" and "any date" via /snapshot/date)
 * 4) /performance route for day/week/month/year changes
 **************************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

/***************************************************************
 * CoinGecko map
 **************************************************************/
const coinGeckoMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  DOGE: 'dogecoin',
  // ...
};

/***************************************************************
 * Helpers for real-time price fetching
 **************************************************************/
async function fetchCurrentPrice(symbol) {
  try {
    const id = coinGeckoMap[symbol.toUpperCase()];
    if (!id) return null;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
    const resp = await axios.get(url);
    return resp.data?.[id]?.usd || 0;
  } catch (err) {
    console.error(`fetchCurrentPrice error for ${symbol}:`, err.message);
    return 0;
  }
}

async function fetchCurrentPrices(symbols) {
  const ids = [];
  const symMap = {};
  for (const sym of symbols) {
    const id = coinGeckoMap[sym.toUpperCase()];
    if (id) {
      ids.push(id);
      symMap[id] = sym;
    }
  }
  if (!ids.length) return {};

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const resp = await axios.get(url);
    const data = resp.data;
    const result = {};
    for (const geckoId in data) {
      const s = symMap[geckoId];
      result[s] = data[geckoId]?.usd || 0;
    }
    return result;
  } catch (err) {
    console.error('fetchCurrentPrices error:', err.message);
    return {};
  }
}

/***************************************************************
 * POST /transactions
 **************************************************************/
app.post('/transactions', async (req, res) => {
    try {
      let {
        date,
        type,
        notes,
        fromSymbol,
        fromQuantity,
        fromPrice,
        toSymbol,
        toQuantity,
        toPrice,
        account,        // 10
        fromAccount,    // 11
        toAccount       // 12
      } = req.body;
  
      // If missing fromPrice or toPrice, fetch them...
      if (!fromPrice && fromSymbol) {
        fromPrice = await fetchCurrentPrice(fromSymbol);
      }
      if (!toPrice && toSymbol) {
        toPrice = await fetchCurrentPrice(toSymbol);
      }
  
      // Here we list all 12 columns
      const sql = `
        INSERT INTO transactions (
          date, type, notes,
          fromSymbol, fromQuantity, fromPrice,
          toSymbol, toQuantity, toPrice,
          account, fromAccount, toAccount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      // We also have 12 items in the same order
      const params = [
        date, type, notes,
        fromSymbol, fromQuantity, fromPrice,
        toSymbol, toQuantity, toPrice,
        account, fromAccount, toAccount
      ];
  
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting transaction:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ id: this.lastID, msg: 'Transaction added successfully' });
      });
    } catch (error) {
      console.error('POST /transactions error:', error.message);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  

/***************************************************************
 * GET /transactions
 **************************************************************/
app.get('/transactions', (req, res) => {
  const sql = 'SELECT * FROM transactions ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('GET /transactions error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/***************************************************************
 * PUT /transactions/:id
 **************************************************************/
app.put('/transactions/:id', (req, res) => {
  const transactionId = req.params.id;
  const {
    date,
    type,
    notes,
    account,
    fromSymbol,
    fromQuantity,
    fromPrice,
    toSymbol,
    toQuantity,
    toPrice,
    fromAccount,
    toAccount
  } = req.body;

  const fetchSql = 'SELECT * FROM transactions WHERE id = ?';
  db.get(fetchSql, [transactionId], (err, existing) => {
    if (err) {
      console.error('Error fetching transaction for update:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updDate = date ?? existing.date;
    const updType = type ?? existing.type;
    const updNotes = notes ?? existing.notes;
    const updAccount = account ?? existing.account;
    const updFromSymbol = fromSymbol ?? existing.fromSymbol;
    const updFromQty = fromQuantity ?? existing.fromQuantity;
    const updFromPrice = fromPrice ?? existing.fromPrice;
    const updToSymbol = toSymbol ?? existing.toSymbol;
    const updToQty = toQuantity ?? existing.toQuantity;
    const updToPrice = toPrice ?? existing.toPrice;
    const updFromAcct = fromAccount ?? existing.fromAccount;
    const updToAcct = toAccount ?? existing.toAccount;

    const updateSql = `
      UPDATE transactions
      SET date = ?,
          type = ?,
          notes = ?,
          account = ?,
          fromSymbol = ?,
          fromQuantity = ?,
          fromPrice = ?,
          toSymbol = ?,
          toQuantity = ?,
          toPrice = ?
          fromAccount = ?,
          toAccount = ?
      WHERE id = ?
    `;
    const params = [
      updDate,
      updType,
      updNotes,
      updAccount,
      updFromSymbol,
      updFromQty,
      updFromPrice,
      updToSymbol,
      updToQty,
      updToPrice,
      updFromAcct,
      updToAcct,
      transactionId
    ];

    db.run(updateSql, params, function(updateErr) {
      if (updateErr) {
        console.error('Error updating transaction:', updateErr);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not updated' });
      }
      res.json({ msg: 'Transaction updated successfully' });
    });
  });
});

/***************************************************************
 * DELETE /transactions/:id
 **************************************************************/
app.delete('/transactions/:id', (req, res) => {
  const transactionId = req.params.id;
  const sql = 'DELETE FROM transactions WHERE id = ?';
  db.run(sql, [transactionId], function(err) {
    if (err) {
      console.error('Error deleting transaction:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ msg: 'Transaction deleted successfully' });
  });
});

/***************************************************************
 * GET /accounts
 **************************************************************/
/***************************************************************
 * GET /accounts/balances
 * 
 * For each account, we do:
 *  - filter transactions to only those with account = that account
 *  - from->to logic to find net quantity of each symbol
 *  - fetch real-time prices from CoinGecko
 *  - compute totalValue plus a breakdown array
 *
 * Returns an array:
 * [
 *   {
 *     account: "MyLedger",
 *     totalValue: 12000,
 *     breakdown: [
 *       { symbol: "BTC", quantity: 0.3, currentPrice: 26000, totalValue: 7800 },
 *       { symbol: "ETH", quantity: 2, currentPrice: 1500, totalValue: 3000 }
 *     ]
 *   },
 *   ...
 * ]
 **************************************************************/
app.get('/accounts/balances', async (req, res) => {
    try {
      // 1) Find all distinct accounts
      const accountsData = await new Promise((resolve, reject) => {
        db.all(`
          SELECT account 
          FROM transactions
          WHERE account IS NOT NULL AND account != ''
          GROUP BY account
        `, [], (err, rows) => {
          if (err) return reject(err);
          resolve(rows); // e.g. [{ account: "Coinbase" }, { account: "Ledger" }]
        });
      });
  
      if (!accountsData.length) {
        return res.json([]);
      }
  
      const results = [];
  
      // 2) For each account, compute net quantities & real-time total
      for (const row of accountsData) {
        const accountName = row.account;
  
        // a) fetch all transactions for this account
        const txs = await new Promise((resolve, reject) => {
          db.all(`
            SELECT *
            FROM transactions
            WHERE account = ?
            ORDER BY date ASC, id ASC
          `, [accountName], (err2, rows2) => {
            if (err2) return reject(err2);
            resolve(rows2);
          });
        });
  
        // b) build net quantity map for each symbol
        const qtyMap = {}; // symbol -> net quantity
        function addQty(sym, delta) {
          if (!qtyMap[sym]) qtyMap[sym] = 0;
          qtyMap[sym] += delta;
        }
  
        // c) apply from->to logic ignoring 'transfer' cost basis
        txs.forEach((tx) => {
            if (tx.fromAccount === accountName) {
                addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
              }
              if (tx.toAccount === accountName) {
                addQty(tx.toSymbol, (tx.toQuantity || 0));
              }
          addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
          addQty(tx.toSymbol, (tx.toQuantity || 0));
        });
  
        // d) filter out any zero or negative quantity
        const symbolsHeld = Object.keys(qtyMap).filter(s => qtyMap[s] > 0);
  
        // e) fetch real-time prices from CoinGecko
        const livePrices = await fetchCurrentPrices(symbolsHeld);
  
        // f) build a breakdown array
        let accountTotalValue = 0;
        const breakdown = [];
        for (const sym of symbolsHeld) {
          const quantity = qtyMap[sym];
          const currentPrice = livePrices[sym] || 0;
          const totalValue = quantity * currentPrice;
          accountTotalValue += totalValue;
  
          breakdown.push({
            symbol: sym,
            quantity,
            currentPrice,
            totalValue
          });
        }
  
        results.push({
          account: accountName,
          totalValue: accountTotalValue,
          breakdown
        });
      }
  
      res.json(results);
    } catch (err) {
      console.error('GET /accounts/balances error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
/***************************************************************
 * GET /portfolio => cost basis
 **************************************************************/
app.get('/portfolio', (req, res) => {
  const sql = 'SELECT * FROM transactions ORDER BY date ASC, id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('GET /portfolio error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const portfolioMap = {};

    function ensureSymbol(sym) {
      if (!portfolioMap[sym]) {
        portfolioMap[sym] = { quantity: 0, totalCost: 0 };
      }
    }

    function handleSell(sym, qty) {
      ensureSymbol(sym);
      const currentQty = portfolioMap[sym].quantity;
      const avgCost = currentQty
        ? portfolioMap[sym].totalCost / currentQty
        : 0;
      portfolioMap[sym].quantity -= qty;
      portfolioMap[sym].totalCost -= (avgCost * qty);
    }

    function handleBuy(sym, qty, px) {
      ensureSymbol(sym);
      portfolioMap[sym].quantity += qty;
      portfolioMap[sym].totalCost += (qty * px);
    }

    rows.forEach((tx) => {
      if (tx.type?.toLowerCase() === 'transfer') {
        return;
      }
      const fromQty = tx.fromQuantity || 0;
      const fromPrice = tx.fromPrice || 0;
      const fromSym = tx.fromSymbol;
      const toQty = tx.toQuantity || 0;
      const toPrice = tx.toPrice || 0;
      const toSym = tx.toSymbol;

      // SELL
      handleSell(fromSym, fromQty);
      // BUY
      handleBuy(toSym, toQty, toPrice);
    });

    const results = Object.keys(portfolioMap).map((symbol) => {
      const { quantity, totalCost } = portfolioMap[symbol];
      const avgCost = (quantity !== 0) ? (totalCost / quantity) : 0;
      return { symbol, quantity, averageCost: avgCost };
    });

    res.json(results);
  });
});

/***************************************************************
 * GET /portfolio-current => real-time
 **************************************************************/
app.get('/portfolio-current', (req, res) => {
  const sql = 'SELECT * FROM transactions ORDER BY date ASC, id ASC';
  db.all(sql, [], async (err, rows) => {
    if (err) {
      console.error('GET /portfolio-current error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const qtyMap = {};
    function addQty(sym, d) {
      if (!qtyMap[sym]) qtyMap[sym] = 0;
      qtyMap[sym] += d;
    }

    rows.forEach((tx) => {
      if (tx.type?.toLowerCase() === 'transfer') return;
      addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
      addQty(tx.toSymbol, tx.toQuantity || 0);
    });

    const symbolsHeld = Object.keys(qtyMap).filter(s => qtyMap[s] > 0);
    const livePrices = await fetchCurrentPrices(symbolsHeld);

    let totalValue = 0;
    const breakdown = [];
    for (const s of symbolsHeld) {
      const qty = qtyMap[s];
      const px = livePrices[s] || 0;
      const val = qty * px;
      totalValue += val;
      breakdown.push({
        symbol: s,
        quantity: qty,
        currentPrice: px,
        totalValue: val
      });
    }

    res.json({ totalValue, breakdown });
  });
});

/***************************************************************
 * Snapshots
 **************************************************************/
// a) getCurrentTotalValue => for "today"
async function getCurrentTotalValue() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM transactions ORDER BY date ASC, id ASC';
    db.all(sql, [], async (err, rows) => {
      if (err) return reject(err);

      const qtyMap = {};
      function addQty(sym, d) {
        if (!qtyMap[sym]) qtyMap[sym] = 0;
        qtyMap[sym] += d;
      }

      rows.forEach((tx) => {
        if (tx.type?.toLowerCase() === 'transfer') return;
        addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
        addQty(tx.toSymbol, tx.toQuantity || 0);
      });

      const syms = Object.keys(qtyMap).filter(s => qtyMap[s] > 0);
      const prices = await fetchCurrentPrices(syms);

      let total = 0;
      for (const sym of syms) {
        total += (qtyMap[sym] * (prices[sym] || 0));
      }
      resolve(total);
    });
  });
}

// b) getTotalValueForDate => simulate "as of dateStr"
async function getTotalValueForDate(dateStr) {
  // We'll only consider transactions where tx.date <= dateStr
  // then compute net quantity the same as above, but ignoring future transactions
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM transactions WHERE date <= ? ORDER BY date ASC, id ASC';
    db.all(sql, [dateStr], async (err, rows) => {
      if (err) return reject(err);

      const qtyMap = {};
      function addQty(sym, d) {
        if (!qtyMap[sym]) qtyMap[sym] = 0;
        qtyMap[sym] += d;
      }

      rows.forEach((tx) => {
        if (tx.type?.toLowerCase() === 'transfer') return;
        addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
        addQty(tx.toSymbol, (tx.toQuantity || 0));
      });

      const syms = Object.keys(qtyMap).filter(s => qtyMap[s] > 0);
      const prices = await fetchCurrentPrices(syms);

      let total = 0;
      for (const sym of syms) {
        total += (qtyMap[sym] * (prices[sym] || 0));
      }
      resolve(total);
    });
  });
}

// POST /snapshot => store "today" total
app.post('/snapshot', async (req, res) => {
  try {
    const totalValue = await getCurrentTotalValue();
    const today = new Date().toISOString().slice(0, 10);

    const sql = 'INSERT INTO portfolio_snapshots (date, totalValue) VALUES (?, ?)';
    db.run(sql, [today, totalValue], function(err) {
      if (err) {
        console.error('Error inserting snapshot:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, date: today, totalValue });
    });
  } catch (err) {
    console.error('Error in POST /snapshot:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /snapshot/date => store "as of dateStr"
app.post('/snapshot/date', async (req, res) => {
  try {
    const { snapshotDate } = req.body;
    if (!snapshotDate) {
      return res.status(400).json({ error: 'Missing snapshotDate in body' });
    }
    // We'll compute the portfolio as if it's snapshotDate
    const totalValue = await getTotalValueForDate(snapshotDate);

    const sql = 'INSERT INTO portfolio_snapshots (date, totalValue) VALUES (?, ?)';
    db.run(sql, [snapshotDate, totalValue], function(err) {
      if (err) {
        console.error('Error inserting snapshot by date:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, date: snapshotDate, totalValue });
    });
  } catch (err) {
    console.error('Error in POST /snapshot/date:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /snapshots => list them
app.get('/snapshots', (req, res) => {
  const sql = 'SELECT * FROM portfolio_snapshots ORDER BY date ASC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching snapshots:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/***************************************************************
 * GET /performance => day/week/month/year changes
 **************************************************************/
app.get('/performance', async (req, res) => {
  try {
    const snapshots = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM portfolio_snapshots ORDER BY date DESC`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    if (!snapshots.length) {
      return res.json({
        message: 'No snapshots available',
        latestValue: 0,
        dayChange: null,
        dayChangePercent: null,
        weekChange: null,
        weekChangePercent: null,
        monthChange: null,
        monthChangePercent: null,
        yearChange: null,
        yearChangePercent: null
      });
    }

    const latestSnapshot = snapshots[0];
    const latestValue = latestSnapshot.totalValue || 0;

    function findSnapshotForOffset(daysAgo) {
      const now = new Date();
      const target = new Date(now.getTime() - daysAgo * 86400000);
      const targetStr = target.toISOString().slice(0, 10);

      let candidate = null;
      for (const snap of snapshots) {
        if (snap.date <= targetStr) {
          candidate = snap;
          break;
        }
      }
      return candidate ? candidate.totalValue : null;
    }

    const dayAgoVal = findSnapshotForOffset(1);
    const weekAgoVal = findSnapshotForOffset(7);
    const monthAgoVal = findSnapshotForOffset(30);
    const yearAgoVal = findSnapshotForOffset(365);

    const result = {
      latestValue,
      dayChange: dayAgoVal !== null ? (latestValue - dayAgoVal) : null,
      dayChangePercent:
        dayAgoVal !== null && dayAgoVal !== 0
          ? ((latestValue - dayAgoVal) / dayAgoVal) * 100
          : null,
      weekChange: weekAgoVal !== null ? (latestValue - weekAgoVal) : null,
      weekChangePercent:
        weekAgoVal !== null && weekAgoVal !== 0
          ? ((latestValue - weekAgoVal) / weekAgoVal) * 100
          : null,
      monthChange: monthAgoVal !== null ? (latestValue - monthAgoVal) : null,
      monthChangePercent:
        monthAgoVal !== null && monthAgoVal !== 0
          ? ((latestValue - monthAgoVal) / monthAgoVal) * 100
          : null,
      yearChange: yearAgoVal !== null ? (latestValue - yearAgoVal) : null,
      yearChangePercent:
        yearAgoVal !== null && yearAgoVal !== 0
          ? ((latestValue - yearAgoVal) / yearAgoVal) * 100
          : null
    };

    res.json(result);
  } catch (err) {
    console.error('GET /performance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
