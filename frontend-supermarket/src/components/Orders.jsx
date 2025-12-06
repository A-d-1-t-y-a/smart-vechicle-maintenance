import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/api';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please login to view orders');
      } else {
        setError('Failed to load orders');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You have no orders yet</p>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <Link key={order.orderId} to={`/orders/${order.orderId}`} className="order-card">
              <div className="order-header">
                <h3>Order #{order.orderId.substring(0, 8)}</h3>
                <span className={`status status-${order.status}`}>{order.status}</span>
              </div>
              <div className="order-details">
                <p>Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                <p>Items: {order.items.length}</p>
                <p className="total">Total: ${order.total.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
