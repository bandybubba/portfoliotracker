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
      {/* SIDEBAR */}
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

      {/* MAIN AREA */}
      <div className="dark-main-container">
        {/* TOP BAR */}
        <header className="dark-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FaBars
              className="sidebar-toggle"
              style={{ fontSize: '20px', marginRight: '15px', cursor: 'pointer' }}
              onClick={toggleSidebar}
            />
            <strong style={{ fontSize: '18px' }}>Portfolio</strong>
          </div>
          <div>User Info / Settings</div>
        </header>

        {/* MAIN CONTENT */}
        <main className="dark-main-content">
          {/* Container to center page content */}
          <div className="dark-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DarkLayout;
