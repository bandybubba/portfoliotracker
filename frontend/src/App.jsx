import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DarkLayout from './DarkLayout';

import Dashboard from './pages/Dashboard';
import ImportCSV from './pages/ImportCSV';
import Transactions from './pages/Transactions';
import Snapshots from './pages/Snapshots';
import Performance from './pages/Performance';
import Accounts from './pages/Accounts';
import ManualBalances from './pages/ManualBalances';

function App() {
  return (
    <BrowserRouter>
      <DarkLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/import-csv" element={<ImportCSV />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/snapshots" element={<Snapshots />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/manual-balances" element={<ManualBalances />} />
        </Routes>
      </DarkLayout>
    </BrowserRouter>
  );
}

export default App;
