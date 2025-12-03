import React, { useState, useEffect } from 'react';
import api from '../services/api';

function ReorderTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReorderTasks();
  }, []);

  const loadReorderTasks = async () => {
    try {
      const response = await api.get('/reorder/tasks');
      setTasks(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reorder tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckReorder = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/reorder/check');
      setTasks(response.data.reorderTasks);
      setSuccess(`Found ${response.data.reorderTasks.length} items needing reorder`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check reorder status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && tasks.length === 0) {
    return <div className="loading">Loading reorder tasks...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Reorder Tasks</h1>
        <button className="btn btn-primary" onClick={handleCheckReorder} disabled={loading}>
          {loading ? 'Checking...' : 'Check Stock Levels'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {tasks.length === 0 ? (
        <div className="card">
          <div className="alert alert-success">
            <strong>Great!</strong> All parts are above their reorder thresholds.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <strong>Alert:</strong> {tasks.length} part(s) need reordering
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Vehicle Model</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Suggested Order Qty</th>
                <th>Supplier</th>
                <th>Unit Price</th>
                <th>Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const estimatedCost = (task.suggestedOrderQuantity || 0) * (task.unitPrice || 0);
                return (
                  <tr key={task.partId}>
                    <td>{task.partName}</td>
                    <td>{task.partNumber}</td>
                    <td>{task.vehicleModel}</td>
                    <td>
                      <span className="badge badge-danger">{task.currentStock}</span>
                    </td>
                    <td>{task.reorderThreshold}</td>
                    <td>
                      <strong>{task.suggestedOrderQuantity}</strong>
                    </td>
                    <td>{task.supplier || 'N/A'}</td>
                    <td>${(task.unitPrice || 0).toFixed(2)}</td>
                    <td>${estimatedCost.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3>Auto-Reorder System</h3>
        <p>
          The system automatically checks stock levels every hour. When a part's stock falls below 
          its reorder threshold, a notification is sent and a reorder task is created.
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>Note:</strong> Make sure to set appropriate reorder thresholds for each part to 
          receive timely alerts.
        </p>
      </div>
    </div>
  );
}

export default ReorderTasks;

