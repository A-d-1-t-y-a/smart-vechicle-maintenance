import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { cartService } from '../services/api';
import Navbar from './Navbar';

function Cart() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  async function loadCart() {
    try {
      setLoading(true);
      const response = await cartService.get();
      setCart(response.data);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) {
      return;
    }

    try {
      await cartService.update(cartItemId, { quantity: newQuantity });
      loadCart();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update quantity');
    }
  }

  async function handleRemoveItem(cartItemId) {
    if (!window.confirm('Remove this item from cart?')) {
      return;
    }

    try {
      await cartService.remove(cartItemId);
      loadCart();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove item');
    }
  }

  async function handleClearCart() {
    if (!window.confirm('Clear entire cart?')) {
      return;
    }

    try {
      await cartService.clear();
      loadCart();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear cart');
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading">Loading cart...</div>
        </div>
      </>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container">
          <h1>Shopping Cart</h1>
          <div className="empty-state">
            <h3>Your cart is empty</h3>
            <p>Start shopping to add items to your cart</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/products')}
              style={{ marginTop: '20px' }}
            >
              Browse Products
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Shopping Cart</h1>
        {error && <div className="error">{error}</div>}

        <div className="card">
          {cart.items.map(item => (
            <div key={item.cartItemId} className="cart-item">
              {item.product?.imageUrl && (
                <img src={item.product.imageUrl} alt={item.product.name} />
              )}
              <div className="cart-item-details" style={{ flex: 1 }}>
                <h3>{item.product?.name || 'Product not found'}</h3>
                <p>${item.product ? parseFloat(item.product.price).toFixed(2) : '0.00'} each</p>
                {item.product && (
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Stock: {item.product.stock}
                  </p>
                )}
              </div>
              <div className="cart-item-actions">
                <div className="quantity-control">
                  <button
                    onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                    disabled={!item.product || item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <strong>
                    ${item.product
                      ? (parseFloat(item.product.price) * item.quantity).toFixed(2)
                      : '0.00'}
                  </strong>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRemoveItem(item.cartItemId)}
                  style={{ marginLeft: '10px' }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="order-summary">
          <div className="order-summary-row">
            <span>Subtotal:</span>
            <span>${parseFloat(cart.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="order-summary-row">
            <span>Items:</span>
            <span>{cart.itemCount}</span>
          </div>
          <div className="order-summary-row total">
            <span>Total:</span>
            <span>${parseFloat(cart.subtotal || 0).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleClearCart}
          >
            Clear Cart
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/products')}
            style={{ flex: 1 }}
          >
            Continue Shopping
          </button>
          <button
            className="btn btn-success"
            onClick={() => navigate('/checkout')}
            style={{ flex: 1 }}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </>
  );
}

export default Cart;
