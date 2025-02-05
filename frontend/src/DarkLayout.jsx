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
      {/* LEFT SIDEBAR */}
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

      {/* RIGHT SIDE: TOP BAR + 2-COLUMN BODY (CENTER + RIGHT) */}
      <div className="dark-main-container">
        {/* TOP BAR ACROSS THE TOP */}
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

        {/* MAIN BODY: center content + right column */}
        <div className="dark-body">
          {/* CENTER BODY */}
          <main className="dark-main">
            <div className="dark-container">
              {children}
            </div>
          </main>

          {/* RIGHT COLUMN (unused if you want, or can store global widgets) */}
          <aside className="dark-rightbar">
            {/* Potentially keep it empty or add something:
                e.g. global metrics, chat widget, user profile, etc. */}
            <div className="dark-card">
              <h3>Right Column</h3>
              <p>
                You can place any global widgets or 
                quick stats here across all pages.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default DarkLayout;
