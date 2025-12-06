import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🛒 Retail Supermarket
        </Link>
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/products" className="navbar-link">Products</Link>
          <Link to="/categories" className="navbar-link">Categories</Link>
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="navbar-link">Cart</Link>
              <Link to="/orders" className="navbar-link">Orders</Link>
              <span className="navbar-user">Hello, {user?.name || user?.email}</span>
              <button onClick={handleSignOut} className="btn btn-secondary">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
