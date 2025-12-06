import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { orderService } from '../services/api';
import Navbar from './Navbar';
import { format } from 'date-fns';

function OrderDetail() {
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadOrder();
    }
  }, [orderId, isAuthenticated]);

  async function loadOrder() {
    try {
      setLoading(true);
      const response = await orderService.get(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading">Loading order...</div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error">{error || 'Order not found'}</div>
          <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
            Back to Orders
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <button className="btn btn-secondary" onClick={() => navigate('/orders')} style={{ marginBottom: '20px' }}>
          ← Back to Orders
        </button>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h1>Order #{order.orderId.split('-')[1]}</h1>
              <p style={{ color: '#666' }}>
                Placed on {format(new Date(order.orderDate), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  background: order.status === 'completed' ? '#28a745' : '#ffc107',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Order Items</h2>
          {order.items.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '15px',
              borderBottom: '1px solid #eee'
            }}>
              <div>
                <h4>{item.name}</h4>
                <p style={{ color: '#666' }}>
                  ${parseFloat(item.price).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>${parseFloat(item.itemTotal).toFixed(2)}</strong>
              </div>
            </div>
          ))}

          <div className="order-summary" style={{ marginTop: '30px' }}>
            <div className="order-summary-row">
              <span>Subtotal:</span>
              <span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="order-summary-row">
              <span>Tax:</span>
              <span>${parseFloat(order.tax).toFixed(2)}</span>
            </div>
            <div className="order-summary-row">
              <span>Shipping:</span>
              <span>${parseFloat(order.shipping).toFixed(2)}</span>
            </div>
            <div className="order-summary-row total">
              <span>Total:</span>
              <span>${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>

          {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Shipping Address</h3>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OrderDetail;
