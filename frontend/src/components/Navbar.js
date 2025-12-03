import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">Parts Inventory System</div>
        <div className="navbar-links">
          <Link to="/">Dashboard</Link>
          <Link to="/parts">Parts</Link>
          <Link to="/stock">Stock</Link>
          <Link to="/reorder">Reorder Tasks</Link>
          <Link to="/analytics">Analytics</Link>
          <button className="btn btn-secondary" onClick={handleSignOut} style={{ marginLeft: '10px' }}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

