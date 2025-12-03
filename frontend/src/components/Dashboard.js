import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/analytics?type=summary');
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="container"><div className="alert alert-error">{error}</div></div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Parts</h3>
          <div className="value">{stats?.totalParts || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Inventory Value</h3>
          <div className="value">${stats?.totalValue?.toLocaleString() || '0'}</div>
        </div>
        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <div className="value" style={{ color: stats?.lowStockCount > 0 ? '#dc3545' : '#28a745' }}>
            {stats?.lowStockCount || 0}
          </div>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <div className="value">{stats?.categoriesCount || 0}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <Link to="/parts/new" className="btn btn-primary">Add New Part</Link>
          <Link to="/parts" className="btn btn-secondary">View All Parts</Link>
          <Link to="/stock" className="btn btn-secondary">Manage Stock</Link>
          <Link to="/reorder" className="btn btn-warning" style={{ backgroundColor: '#ffc107', color: '#333' }}>
            View Reorder Tasks
          </Link>
          <Link to="/analytics" className="btn btn-secondary">View Analytics</Link>
        </div>
      </div>

      {stats?.lowStockCount > 0 && (
        <div className="card">
          <div className="alert alert-error">
            <strong>Alert:</strong> You have {stats.lowStockCount} part(s) below reorder threshold. 
            <Link to="/reorder" style={{ marginLeft: '10px', color: '#721c24', textDecoration: 'underline' }}>
              View reorder tasks
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

