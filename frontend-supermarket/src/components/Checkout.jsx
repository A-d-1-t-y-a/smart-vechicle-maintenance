import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cartData.length === 0) {
      navigate('/cart');
      return;
    }
    setCart(cartData);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        locationId: item.locationId
      }));

      const orderData = {
        items,
        shippingAddress,
        paymentMethod
      };

      const response = await orderService.create(orderData);
      localStorage.removeItem('cart');
      navigate(`/orders/${response.data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
      setLoading(false);
    }
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-container">
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-section">
            <h2>Shipping Address</h2>
            <div className="form-group">
              <label>Street Address *</label>
              <input
                type="text"
                required
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                required
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                required
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Zip Code *</label>
              <input
                type="text"
                required
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Country *</label>
              <input
                type="text"
                required
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Payment Method</h2>
            <div className="form-group">
              <label>Payment Method *</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash on Delivery</option>
                <option value="card">Credit/Debit Card</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="order-items">
            {cart.map((item, index) => (
              <div key={index} className="order-item">
                <span>{item.productName} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <p>Subtotal: ${getTotal().toFixed(2)}</p>
            <p>Tax: ${(getTotal() * 0.1).toFixed(2)}</p>
            <p className="total">Total: ${(getTotal() * 1.1).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
