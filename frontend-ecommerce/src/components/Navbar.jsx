import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { cartService } from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadCartCount();
    }
  }, [isAuthenticated]);

  async function loadCartCount() {
    try {
      const response = await cartService.get();
      setCartCount(response.data.itemCount || 0);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  if (!isAuthenticated) {
    return (
      <div className="navbar">
        <h1>🛍️ Ecommerce Platform</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
        </nav>
      </div>
    );
  }

  return (
    <div className="navbar">
      <h1>🛍️ Ecommerce Platform</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/cart">
          Cart
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        <Link to="/orders">Orders</Link>
        <Link to="/admin/add-products">Add Products</Link>
        {user && <span>Hello, {user.name || user.email}</span>}
        <button className="btn btn-secondary" onClick={handleSignOut} style={{ marginLeft: '10px' }}>
          Sign Out
        </button>
      </nav>
    </div>
  );
}

export default Navbar;
