import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Cart.css';

function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
  };

  const updateQuantity = (productId, locationId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId, locationId);
      return;
    }
    const updatedCart = cart.map(item => {
      if (item.productId === productId && item.locationId === locationId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId, locationId) => {
    const updatedCart = cart.filter(
      item => !(item.productId === productId && item.locationId === locationId)
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1>Shopping Cart</h1>
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="cart-container">
        <div className="cart-items">
          {cart.map((item, index) => (
            <div key={`${item.productId}-${item.locationId}-${index}`} className="cart-item">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.productName} />
              )}
              <div className="item-info">
                <h3>{item.productName}</h3>
                <p>Location: {item.locationId}</p>
                <p className="item-price">${item.price.toFixed(2)} each</p>
              </div>
              <div className="item-quantity">
                <button 
                  onClick={() => updateQuantity(item.productId, item.locationId, item.quantity - 1)}
                  className="quantity-btn"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.productId, item.locationId, item.quantity + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
              <div className="item-total">
                <p>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <button 
                onClick={() => removeItem(item.productId, item.locationId)}
                className="btn btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <p>Subtotal: ${getTotal().toFixed(2)}</p>
          <p>Tax: ${(getTotal() * 0.1).toFixed(2)}</p>
          <p className="total">Total: ${(getTotal() * 1.1).toFixed(2)}</p>
          <button 
            onClick={() => navigate('/checkout')}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
          >
            Proceed to Checkout
          </button>
          <Link to="/products" className="btn btn-secondary" style={{ width: '100%', marginTop: '10px', display: 'block', textAlign: 'center' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
