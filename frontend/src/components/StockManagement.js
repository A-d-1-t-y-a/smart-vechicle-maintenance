import React, { useState, useEffect } from 'react';
import api from '../services/api';

function StockManagement() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({ quantity: '', operation: 'set' });

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const response = await api.get('/parts');
      setParts(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (partId) => {
    if (!stockUpdate.quantity || isNaN(stockUpdate.quantity)) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      await api.put(`/stock/${partId}`, {
        quantity: parseInt(stockUpdate.quantity),
        operation: stockUpdate.operation,
        vehicleModel: 'ALL'
      });
      setSuccess('Stock updated successfully');
      setSelectedPart(null);
      setStockUpdate({ quantity: '', operation: 'set' });
      loadParts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update stock');
    }
  };

  if (loading) {
    return <div className="loading">Loading stock information...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>Stock Management</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Parts Stock Levels</h2>
        {parts.length === 0 ? (
          <p>No parts found. <a href="/parts/new">Add your first part</a></p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Vehicle Model</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => {
                const isLowStock = (part.currentStock || 0) <= (part.reorderThreshold || 0);
                return (
                  <tr key={part.partId}>
                    <td>{part.partName}</td>
                    <td>{part.partNumber}</td>
                    <td>{part.vehicleModel || 'ALL'}</td>
                    <td>{part.currentStock || 0}</td>
                    <td>{part.reorderThreshold || 0}</td>
                    <td>
                      {isLowStock ? (
                        <span className="badge badge-danger">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => setSelectedPart(part)}
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedPart && (
        <div className="modal" onClick={() => setSelectedPart(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Stock: {selectedPart.partName}</h2>
              <span className="close" onClick={() => setSelectedPart(null)}>&times;</span>
            </div>
            <div className="form-group">
              <label>Current Stock: {selectedPart.currentStock || 0}</label>
            </div>
            <div className="form-group">
              <label>Operation</label>
              <select
                value={stockUpdate.operation}
                onChange={(e) => setStockUpdate({ ...stockUpdate, operation: e.target.value })}
              >
                <option value="set">Set to</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={stockUpdate.quantity}
                onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: e.target.value })}
                min="0"
                placeholder="Enter quantity"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleStockUpdate(selectedPart.partId)}
              >
                Update
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedPart(null);
                  setStockUpdate({ quantity: '', operation: 'set' });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagement;

