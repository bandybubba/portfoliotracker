/************************************************************
 * backend/db.js
 * 
 * Adds fromAccount/toAccount columns to the "transactions" table
 * so we can handle transferring tokens between different accounts.
 ************************************************************/
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      type TEXT,
      notes TEXT,
      account TEXT, -- for buy/sell if you want
      fromSymbol TEXT,
      fromQuantity REAL,
      fromPrice REAL,
      toSymbol TEXT,
      toQuantity REAL,
      toPrice REAL,
      -- new columns:
      fromAccount TEXT,
      toAccount TEXT
    )
  `);
  
  db.run(`
  CREATE TABLE IF NOT EXISTS manual_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account TEST,
    symbol TEXT,
    quantity REAL,
    notes TEXT
  )
`);

  db.run(`CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    totalValue REAL
  )`);

  // Try to ALTER for fromAccount/toAccount if missing
  db.run(`ALTER TABLE transactions ADD COLUMN fromAccount TEXT`, () => {});
db.run(`ALTER TABLE transactions ADD COLUMN toAccount TEXT`, () => {});
db.run(`ALTER TABLE transactions ADD COLUMN account TEXT`, () => {});
});

module.exports = db;
