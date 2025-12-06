import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../services/api';
import './OrderDetail.css';

function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await orderService.get(orderId);
      setOrder(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load order details');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (error || !order) {
    return <div className="error">{error || 'Order not found'}</div>;
  }

  return (
    <div className="order-detail-page">
      <h1>Order Details</h1>
      <div className="order-detail-container">
        <div className="order-info">
          <div className="info-section">
            <h2>Order Information</h2>
            <p><strong>Order ID:</strong> {order.orderId}</p>
            <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
            <p><strong>Status:</strong> <span className={`status status-${order.status}`}>{order.status}</span></p>
            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
          </div>

          <div className="info-section">
            <h2>Shipping Address</h2>
            {order.shippingAddress && (
              <>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </>
            )}
          </div>
        </div>

        <div className="order-items-section">
          <h2>Order Items</h2>
          <div className="items-list">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <h3>{item.productName}</h3>
                  <p>Location: {item.locationId}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ${item.price.toFixed(2)} each</p>
                </div>
                <div className="item-subtotal">
                  ${item.subtotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="order-total">
            <p>Subtotal: ${order.total.toFixed(2)}</p>
            <p>Tax: ${(order.total * 0.1).toFixed(2)}</p>
            <p className="total">Total: ${(order.total * 1.1).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
