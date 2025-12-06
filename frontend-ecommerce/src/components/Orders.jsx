import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { orderService } from '../services/api';
import Navbar from './Navbar';
import { format } from 'date-fns';

function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');
      const response = await orderService.getAll();
      
      // Check if response has data
      if (response && response.data) {
        setOrders(response.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to load orders';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check your API URL and network connection.';
      } else {
        // Error in request setup
        errorMessage = error.message || 'Failed to load orders';
      }
      
      setError(errorMessage);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading">Loading orders...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>My Orders</h1>
        {error && <div className="error">{error}</div>}

        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>Start shopping to place your first order</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/products')}
              style={{ marginTop: '20px' }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div>
            {orders.map(order => (
              <div
                key={order.orderId}
                className="card"
                style={{ cursor: 'pointer', marginBottom: '15px' }}
                onClick={() => navigate(`/orders/${order.orderId}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>Order #{order.orderId.split('-')[1]}</h3>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      {format(new Date(order.orderDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p style={{ marginTop: '10px' }}>
                      <strong>Items:</strong> {order.items.length} item(s)
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="price" style={{ fontSize: '24px', marginBottom: '5px' }}>
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                    <span
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        background: order.status === 'completed' ? '#28a745' : '#ffc107',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Orders;
