import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { cartService, orderService } from '../services/api';
import Navbar from './Navbar';

function Checkout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    useSameAddress: true
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  async function loadCart() {
    try {
      setLoading(true);
      const response = await cartService.get();
      setCart(response.data);
      if (!response.data.items || response.data.items.length === 0) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(field, value) {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const orderData = {
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useSameAddress 
          ? formData.shippingAddress 
          : formData.billingAddress
      };

      const response = await orderService.create(orderData);
      navigate(`/orders/${response.data.orderId}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error">Your cart is empty</div>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Checkout</h1>
        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2', minWidth: '300px' }}>
            <form onSubmit={handleSubmit}>
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2>Shipping Address</h2>
                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleInputChange('shippingAddress.street', e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>City *</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>State *</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleInputChange('shippingAddress.state', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Zip Code *</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleInputChange('shippingAddress.zipCode', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Country *</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.country}
                      onChange={(e) => handleInputChange('shippingAddress.country', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.useSameAddress}
                      onChange={(e) => handleInputChange('useSameAddress', e.target.checked)}
                    />
                    {' '}Use same address for billing
                  </label>
                </div>

                {!formData.useSameAddress && (
                  <>
                    <h3>Billing Address</h3>
                    <div className="form-group">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        value={formData.billingAddress.street}
                        onChange={(e) => handleInputChange('billingAddress.street', e.target.value)}
                        required={!formData.useSameAddress}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>City *</label>
                        <input
                          type="text"
                          value={formData.billingAddress.city}
                          onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                          required={!formData.useSameAddress}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>State *</label>
                        <input
                          type="text"
                          value={formData.billingAddress.state}
                          onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                          required={!formData.useSameAddress}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Zip Code *</label>
                        <input
                          type="text"
                          value={formData.billingAddress.zipCode}
                          onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                          required={!formData.useSameAddress}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Country *</label>
                        <input
                          type="text"
                          value={formData.billingAddress.country}
                          onChange={(e) => handleInputChange('billingAddress.country', e.target.value)}
                          required={!formData.useSameAddress}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting}
                style={{ width: '100%', fontSize: '18px', padding: '15px' }}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div style={{ flex: '1', minWidth: '300px' }}>
            <div className="card">
              <h2>Order Summary</h2>
              {cart.items.map(item => (
                <div key={item.cartItemId} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <strong>{item.product?.name || 'Product'}</strong>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      ${item.product ? parseFloat(item.product.price).toFixed(2) : '0.00'} × {item.quantity}
                    </p>
                  </div>
                  <div>
                    <strong>
                      ${item.product
                        ? (parseFloat(item.product.price) * item.quantity).toFixed(2)
                        : '0.00'}
                    </strong>
                  </div>
                </div>
              ))}

              <div className="order-summary" style={{ marginTop: '20px' }}>
                <div className="order-summary-row">
                  <span>Subtotal:</span>
                  <span>${parseFloat(cart.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="order-summary-row">
                  <span>Tax (10%):</span>
                  <span>${(parseFloat(cart.subtotal || 0) * 0.1).toFixed(2)}</span>
                </div>
                <div className="order-summary-row">
                  <span>Shipping:</span>
                  <span>
                    {parseFloat(cart.subtotal || 0) > 100 
                      ? '$0.00 (Free)' 
                      : '$10.00'}
                  </span>
                </div>
                <div className="order-summary-row total">
                  <span>Total:</span>
                  <span>
                    ${(
                      parseFloat(cart.subtotal || 0) + 
                      (parseFloat(cart.subtotal || 0) * 0.1) + 
                      (parseFloat(cart.subtotal || 0) > 100 ? 0 : 10)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Checkout;
