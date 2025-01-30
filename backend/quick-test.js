// quick-test.js
const db = require('./db');

db.all('SELECT * FROM transactions', [], (err, rows) => {
  if (err) {
    return console.error(err);
  }
  console.log('Transactions:', rows);
});
