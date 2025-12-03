import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/analytics');
      setAnalytics(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="container"><div className="alert alert-error">{error}</div></div>;
  }

  if (!analytics) {
    return <div className="container"><div className="alert alert-info">No data available</div></div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Analytics Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Parts</h3>
          <div className="value">{analytics.totalParts || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Inventory Value</h3>
          <div className="value">${(analytics.totalValue || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <div className="value" style={{ color: analytics.lowStockCount > 0 ? '#dc3545' : '#28a745' }}>
            {analytics.lowStockCount || 0}
          </div>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <div className="value">{Object.keys(analytics.categories || {}).length}</div>
        </div>
        <div className="stat-card">
          <h3>Vehicle Models</h3>
          <div className="value">{Object.keys(analytics.vehicleModels || {}).length}</div>
        </div>
      </div>

      {analytics.lowStockCount > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Low Stock Items</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Vehicle Model</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.lowStockItems.map((item) => (
                <tr key={item.partId}>
                  <td>{item.partName}</td>
                  <td>{item.partNumber}</td>
                  <td>{item.vehicleModel}</td>
                  <td>
                    <span className="badge badge-danger">{item.currentStock}</span>
                  </td>
                  <td>{item.reorderThreshold}</td>
                  <td>
                    <span className="badge badge-warning">Needs Reorder</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(analytics.categories || {}).length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Category Breakdown</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Parts Count</th>
                <th>Total Value</th>
                <th>Low Stock Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.categories).map(([category, data]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{data.count}</td>
                  <td>${(data.totalValue || 0).toFixed(2)}</td>
                  <td>
                    {data.lowStockCount > 0 ? (
                      <span className="badge badge-danger">{data.lowStockCount}</span>
                    ) : (
                      <span className="badge badge-success">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(analytics.vehicleModels || {}).length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Vehicle Model Breakdown</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle Model</th>
                <th>Parts Count</th>
                <th>Total Value</th>
                <th>Low Stock Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.vehicleModels).map(([model, data]) => (
                <tr key={model}>
                  <td>{model}</td>
                  <td>{data.count}</td>
                  <td>${(data.totalValue || 0).toFixed(2)}</td>
                  <td>
                    {data.lowStockCount > 0 ? (
                      <span className="badge badge-danger">{data.lowStockCount}</span>
                    ) : (
                      <span className="badge badge-success">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Analytics;

