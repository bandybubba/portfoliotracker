import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaChartPie,
  FaFileImport,
  FaList,
  FaCameraRetro,
  FaChartLine,
  FaUsers,
  FaBars
} from 'react-icons/fa';

import './DarkStyles.css';

function DarkLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dark-layout">
      <aside className={`dark-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <h2>
          <FaChartPie />
          My Portfolio
        </h2>
        <ul>
          <li>
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
              <FaChartPie />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/manual-balances" onClick={() => setSidebarOpen(false)}>
              <FaList />
              Manual Balances
            </Link>
          </li>
          <li>
            <Link to="/import-csv" onClick={() => setSidebarOpen(false)}>
              <FaFileImport />
              Import CSV
            </Link>
          </li>
          <li>
            <Link to="/transactions" onClick={() => setSidebarOpen(false)}>
              <FaList />
              Transactions
            </Link>
          </li>
          <li>
            <Link to="/snapshots" onClick={() => setSidebarOpen(false)}>
              <FaCameraRetro />
              Snapshots
            </Link>
          </li>
          <li>
            <Link to="/performance" onClick={() => setSidebarOpen(false)}>
              <FaChartLine />
              Performance
            </Link>
          </li>
          <li>
            <Link to="/accounts" onClick={() => setSidebarOpen(false)}>
              <FaUsers />
              Accounts
            </Link>
          </li>
        </ul>
      </aside>

      <div className="dark-main-container">
        <header className="dark-topbar">
          <div className="dark-topbar-left">
            <FaBars
              className="sidebar-toggle"
              onClick={toggleSidebar}
            />
            <strong>Portfolio</strong>
          </div>
          <div className="dark-topbar-right">
            User Info / Settings
          </div>
        </header>

        <main className="dark-main-content">
          <div className="dark-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DarkLayout;
