/***************************************************************
 * backend/index.js
 *
 * 1) from->to transactions with fromPrice/toPrice
 * 2) /portfolio, /portfolio-current
 * 3) Snapshots (both "today" and "any date" via /snapshot/date)
 * 4) /performance route for day/week/month/year changes
 * 5) CSV Import route (POST /transactions/import-csv)
 **************************************************************/

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');

// For CSV import
const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' }); // temp folder for CSV files

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
  NOVA: 'ai-shell-nova',
  FET: 'fetch-ai',
  AERO: 'aerodrome-finance',
  ALGO: 'algorand',
  BNB: 'binancecoin',
  CPOOL: 'clearpool',
  CROW: 'cr0w-by-virtuals',
  ENA: 'ethena',
  HBAR: 'hedera-hashgraph',
  HYPE: 'hyperliquid',
  LINK: 'chainlink',
  ONDO: 'ondo-finance',
  RENDER: 'render-token',
  ROOT: 'the-root-network',
  SHDW: 'genesysgo-shadow',
  SUI: 'sui',
  SYLO: 'sylo',
  VIRTUAL: 'virtual-protocol',
  UNI: 'uniswap',
  XRP: 'ripple',
  XTZ: 'tezos',
  ZEC: 'zcash',
  USDC: 'usd-coin',
  LTC: 'litecoin',
  SOL: 'solana',
  PEPE: 'pepe',
  XLM: 'stellar',
  AVAX: 'avalanche-2',
  ADA: 'cardano',
  NEAR: 'near',
  JTO: 'jito-governance-token',
  DOT: 'polkadot',
  OXT: 'orchid-protocol',
  USDT: 'tether',
  SKI: 'ski-mask-dog'

};

/***************************************************************
 * Helpers: fetchCurrentPrice, fetchCurrentPrices
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
      account,
      fromAccount,
      toAccount
    } = req.body;

    if (!fromPrice && fromSymbol) {
      fromPrice = await fetchCurrentPrice(fromSymbol);
    }
    if (!toPrice && toSymbol) {
      toPrice = await fetchCurrentPrice(toSymbol);
    }

    const sql = `
      INSERT INTO transactions (
        date, type, notes,
        fromSymbol, fromQuantity, fromPrice,
        toSymbol, toQuantity, toPrice,
        account, fromAccount, toAccount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
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
          toPrice = ?,
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
 * MANUAL BALANCES - Optional feature, no cost basis changes
 **************************************************************/

/*
  Make sure your DB table has columns: id, account, symbol, quantity, notes
  Example:
  CREATE TABLE IF NOT EXISTS manual_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account TEXT,
    symbol TEXT,
    quantity REAL,
    notes TEXT
  );
  If you only had symbol, quantity, notes before, do:
    ALTER TABLE manual_balances ADD COLUMN account TEXT;
*/

/**
 * POST /manual-balances
 * Expects { account, symbol, quantity, notes }
 */
app.post('/manual-balances', (req, res) => {
    const { account, symbol, notes } = req.body;
    let { quantity } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    quantity = parseFloat(quantity) || 0;
  
    const sql = `
      INSERT INTO manual_balances (account, symbol, quantity, notes)
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [account, symbol, quantity, notes], function(err) {
      if (err) {
        console.error('Error inserting manual balance:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, msg: 'Manual balance added' });
    });
  });
  
  /**
   * GET /manual-balances
   * Lists all manual balances (raw) from the DB table
   */
  app.get('/manual-balances', (req, res) => {
    const sql = 'SELECT * FROM manual_balances ORDER BY id ASC';
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('GET /manual-balances error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    });
  });
  
  /**
   * PUT /manual-balances/:id
   * Expects { account, symbol, quantity, notes } to update
   */
  app.put('/manual-balances/:id', (req, res) => {
    const balanceId = req.params.id;
    const { account, symbol, notes } = req.body;
    let { quantity } = req.body;
    quantity = parseFloat(quantity) || 0;
  
    const fetchSql = 'SELECT * FROM manual_balances WHERE id = ?';
    db.get(fetchSql, [balanceId], (err, existing) => {
      if (err) {
        console.error('Error fetching manual balance:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!existing) {
        return res.status(404).json({ error: 'Manual balance not found' });
      }
  
      const updAccount = account !== undefined ? account : existing.account;
      const updSymbol = symbol !== undefined ? symbol : existing.symbol;
      const updQty = req.body.quantity !== undefined ? quantity : existing.quantity;
      const updNotes = notes !== undefined ? notes : existing.notes;
  
      const updateSql = `
        UPDATE manual_balances
        SET account = ?,
            symbol = ?,
            quantity = ?,
            notes = ?
        WHERE id = ?
      `;
      db.run(updateSql, [updAccount, updSymbol, updQty, updNotes, balanceId], function(updateErr) {
        if (updateErr) {
          console.error('Error updating manual balance:', updateErr);
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'No row updated' });
        }
        res.json({ msg: 'Manual balance updated' });
      });
    });
  });
  
  /**
   * DELETE /manual-balances/:id
   */
  app.delete('/manual-balances/:id', (req, res) => {
    const balanceId = req.params.id;
    const sql = 'DELETE FROM manual_balances WHERE id = ?';
    db.run(sql, [balanceId], function(err) {
      if (err) {
        console.error('Error deleting manual balance:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Manual balance not found' });
      }
      res.json({ msg: 'Manual balance deleted' });
    });
  });
  
  /***************************************************************
   * GET /manual-balances-overview
   * Summarizes everything byAccount & bySymbol with real-time price
   * 
   * Output shape:
   * {
   *   totalValue: number,
   *   byAccount: [
   *     {
   *       account: "Chase",
   *       totalValue: 2000,
   *       breakdown: [
   *         { symbol, quantity, currentPrice, totalValue }
   *       ]
   *     },
   *     ...
   *   ],
   *   bySymbol: [
   *     {
   *       symbol: "BTC",
   *       totalQuantity: 2.5,
   *       currentPrice: 26000,
   *       totalValue: 65000
   *     },
   *     ...
   *   ]
   * }
   **************************************************************/
  app.get('/manual-balances-overview', async (req, res) => {
    try {
      // 1) fetch all rows
      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT account, symbol, quantity FROM manual_balances', [], (err, r) => {
          if (err) return reject(err);
          resolve(r);
        });
      });
      if (!rows.length) {
        return res.json({
          totalValue: 0,
          byAccount: [],
          bySymbol: []
        });
      }
  
      // 2) sum quantity by symbol for real-time prices
      const symbolMap = {};
      for (const row of rows) {
        const sym = (row.symbol || '').toUpperCase();
        if (!symbolMap[sym]) symbolMap[sym] = 0;
        symbolMap[sym] += (row.quantity || 0);
      }
  
      // 3) fetch from your existing function: fetchCurrentPrices(symbols)
      //    if a symbol isn't recognized by CoinGecko, price=0
      const symbols = Object.keys(symbolMap);
      const prices = await fetchCurrentPrices(symbols);
  
      // 4) build byAccount
      // group rows by (account => breakdown of symbol, quantity)
      const accountMap = {}; 
      for (const row of rows) {
        const acct = row.account || 'NoAccount';
        const sym = (row.symbol || '').toUpperCase();
        const qty = row.quantity || 0;
  
        if (!accountMap[acct]) {
          accountMap[acct] = {
            breakdown: [],
            accountTotal: 0
          };
        }
        // see if we already have that symbol in breakdown
        const existing = accountMap[acct].breakdown.find(x => x.symbol === sym);
        if (existing) {
          existing.quantity += qty;
        } else {
          accountMap[acct].breakdown.push({
            symbol: sym,
            quantity: qty,
            currentPrice: 0,
            totalValue: 0
          });
        }
      }
  
      // now apply real-time prices
      for (const acct in accountMap) {
        let acctTotal = 0;
        for (const item of accountMap[acct].breakdown) {
          const px = prices[item.symbol] || 0;
          item.currentPrice = px;
          item.totalValue = px * item.quantity;
          acctTotal += item.totalValue;
        }
        accountMap[acct].accountTotal = acctTotal;
      }
  
      const byAccount = Object.keys(accountMap).map(acct => ({
        account: acct,
        totalValue: accountMap[acct].accountTotal,
        breakdown: accountMap[acct].breakdown
      }));
  
      // 5) build bySymbol
      const bySymbol = [];
      for (const sym of symbols) {
        const qty = symbolMap[sym];
        const px = prices[sym] || 0;
        const val = qty * px;
        bySymbol.push({
          symbol: sym,
          totalQuantity: qty,
          currentPrice: px,
          totalValue: val
        });
      }
  
      // overall total
      const totalValue = bySymbol.reduce((sum, i) => sum + i.totalValue, 0);
  
      // 6) respond
      res.json({
        totalValue,
        byAccount,
        bySymbol
      });
    } catch (err) {
      console.error('Error in GET /manual-balances-overview:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  

/***************************************************************
 * POST /transactions/batch-delete
 * Accepts JSON: { ids: [1,2,3] }
 * Deletes them in a single statement.
 **************************************************************/
app.post('/transactions/batch-delete', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'No valid "ids" array provided' });
    }
  
    // single query
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM transactions WHERE id IN (${placeholders})`;
  
    db.run(sql, ids, function(err) {
      if (err) {
        console.error('Error deleting multiple transactions:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json({ msg: 'Batch delete successful', count: this.changes });
    });
  });
/***************************************************************
 * CSV Import Route: POST /transactions/import-csv
 **************************************************************/
app.post(
  '/transactions/import-csv',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });
      if (parseResult.errors.length) {
        console.error('CSV parse errors:', parseResult.errors);
        return res.status(400).json({ error: 'Error parsing CSV', details: parseResult.errors });
      }

      const rows = parseResult.data;
      if (!rows.length) {
        return res.status(400).json({ error: 'CSV has no data' });
      }

      let insertedCount = 0;
      for (const row of rows) {
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
        } = row;

        const fQty = parseFloat(fromQuantity) || 0;
        const fPrice = parseFloat(fromPrice) || 0;
        const tQty = parseFloat(toQuantity) || 0;
        const tPrice = parseFloat(toPrice) || 0;

        const insertSql = `
          INSERT INTO transactions (
            date, type, notes, account,
            fromSymbol, fromQuantity, fromPrice,
            toSymbol, toQuantity, toPrice,
            fromAccount, toAccount
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          date, type, notes, account,
          fromSymbol, fQty, fPrice,
          toSymbol, tQty, tPrice,
          fromAccount, toAccount
        ];

        await new Promise((resolve, reject) => {
          db.run(insertSql, params, function(err) {
            if (err) return reject(err);
            resolve();
          });
        });

        insertedCount++;
      }

      fs.unlinkSync(filePath); // clean temp file

      res.json({ msg: 'CSV import successful', inserted: insertedCount });
    } catch (err) {
      console.error('CSV import error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/***************************************************************
 * GET /accounts
 **************************************************************/
/***************************************************************
 * GET /accounts/balances
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
        resolve(rows);
      });
    });

    if (!accountsData.length) {
      return res.json([]);
    }

    const results = [];
    for (const row of accountsData) {
      const accountName = row.account;
      // gather transactions for that account
      const txs = await new Promise((resolve, reject) => {
        db.all(
          `
          SELECT *
          FROM transactions
          WHERE account = ?
          ORDER BY date ASC, id ASC
        `,
          [accountName],
          (err2, rows2) => {
            if (err2) return reject(err2);
            resolve(rows2);
          }
        );
      });

      // net quantity
      const qtyMap = {};
      function addQty(sym, delta) {
        if (!qtyMap[sym]) qtyMap[sym] = 0;
        qtyMap[sym] += delta;
      }

      txs.forEach((tx) => {
        if (tx.fromAccount === accountName) {
          addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
        }
        if (tx.toAccount === accountName) {
          addQty(tx.toSymbol, (tx.toQuantity || 0));
        }
        if (tx.type?.toLowerCase() !== 'transfer') {
          addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
          addQty(tx.toSymbol, (tx.toQuantity || 0));
        }
      });

      const symbolsHeld = Object.keys(qtyMap).filter(s => qtyMap[s] > 0);
      const livePrices = await fetchCurrentPrices(symbolsHeld);

      let accountTotalValue = 0;
      const breakdown = [];
      for (const sym of symbolsHeld) {
        const quantity = qtyMap[sym];
        const price = livePrices[sym] || 0;
        const totalValue = quantity * price;
        accountTotalValue += totalValue;
        breakdown.push({ symbol: sym, quantity, currentPrice: price, totalValue });
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
        ? (portfolioMap[sym].totalCost / currentQty)
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

      handleSell(fromSym, fromQty);
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
/***************************************************************
 * GET /portfolio-current => real-time valuations
 * We now do net quantity for ALL transaction types 
 * (buy, sell, swap, transfer, etc.)
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
        // we no longer skip "transfer"
        // any fromSymbol -> subtract
        addQty(tx.fromSymbol, -(tx.fromQuantity || 0));
        // any toSymbol -> add
        addQty(tx.toSymbol, (tx.toQuantity || 0));
      });
  
      const symbolsHeld = Object.keys(qtyMap).filter((s) => qtyMap[s] > 0);
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
 * Snapshots & Performance
 **************************************************************/
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
        total += qtyMap[sym] * (prices[sym] || 0);
      }
      resolve(total);
    });
  });
}

async function getTotalValueForDate(dateStr) {
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
        total += qtyMap[sym] * (prices[sym] || 0);
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

/***************************************************************
 * Start the server
 **************************************************************/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
