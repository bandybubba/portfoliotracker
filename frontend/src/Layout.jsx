// frontend/src/Layout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './layout.css'; // optional for custom tweaks

function Layout({ children }) {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="bg-dark text-white p-3"
        style={{ width: '220px', minHeight: '100vh' }}
      >
        <h2 className="mb-4">My Portfolio</h2>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link to="/dashboard" className="nav-link text-white">
              Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/import-csv" className="nav-link text-white">
              ImportCSV
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/transactions" className="nav-link text-white">
              Transactions
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/snapshots" className="nav-link text-white">
              Snapshots
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/performance" className="nav-link text-white">
              Performance
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/accounts" className="nav-link text-white">
              Accounts
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        <nav className="navbar navbar-dark bg-dark">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h1">My Portfolio Admin</span>
          </div>
        </nav>
        <div className="container mt-4">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
