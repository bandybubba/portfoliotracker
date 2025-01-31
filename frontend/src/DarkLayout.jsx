/************************************************************
 * src/DarkLayout.jsx
 *
 * A full "dark" layout with:
 * - Sidebar (ul links)
 * - Topbar
 * - Main content that renders the children
 ************************************************************/
import React from 'react';
import { Link } from 'react-router-dom';
import './DarkStyles.css'; // Import the CSS from File 1

function DarkLayout({ children }) {
  return (
    <div className="dark-layout">
      {/* SIDEBAR */}
      <aside className="dark-sidebar">
        <h2>My Portfolio</h2>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/import-csv">Import CSV</Link></li>
          <li><Link to="/transactions">Transactions</Link></li>
          <li><Link to="/snapshots">Snapshots</Link></li>
          <li><Link to="/performance">Performance</Link></li>
          <li><Link to="/accounts">Accounts</Link></li>
        </ul>
      </aside>

      {/* MAIN COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* TOPBAR */}
        <header className="dark-topbar">
          <div><strong>My Portfolio Admin</strong></div>
          <div>User Info or Settings</div>
        </header>

        {/* MAIN CONTENT */}
        <main className="dark-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DarkLayout;
