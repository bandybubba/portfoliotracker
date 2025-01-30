// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Our pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Snapshots from './pages/Snapshots';
import Performance from './pages/Performance';
import Accounts from './pages/Accounts';

// Our new Layout
import Layout from './Layout';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/snapshots" element={<Snapshots />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/accounts" element={<Accounts />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
