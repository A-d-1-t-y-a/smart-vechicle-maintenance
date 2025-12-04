import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function PartsList() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ vehicleModel: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadParts = async () => {
    try {
      const params = filter.vehicleModel ? { vehicleModel: filter.vehicleModel } : {};
      const response = await api.get('/parts', { params });
      setParts(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (partId) => {
    if (!window.confirm('Are you sure you want to delete this part?')) {
      return;
    }

    try {
      await api.delete(`/parts/${partId}`);
      loadParts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete part');
    }
  };

  if (loading) {
    return <div className="loading">Loading parts...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Parts Inventory</h1>
        <Link to="/parts/new" className="btn btn-primary">Add New Part</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label>Filter by Vehicle Model</label>
          <input
            type="text"
            value={filter.vehicleModel}
            onChange={(e) => setFilter({ ...filter, vehicleModel: e.target.value })}
            placeholder="Enter vehicle model"
          />
        </div>
      </div>

      <div className="card">
        {parts.length === 0 ? (
          <p>No parts found. <Link to="/parts/new">Add your first part</Link></p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Vehicle Model</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Unit Price</th>
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
                    <td>{part.category || 'N/A'}</td>
                    <td>{part.currentStock || 0}</td>
                    <td>{part.reorderThreshold || 0}</td>
                    <td>${(part.unitPrice || 0).toFixed(2)}</td>
                    <td>
                      {isLowStock ? (
                        <span className="badge badge-danger">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => navigate(`/parts/edit/${part.partId}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleDelete(part.partId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PartsList;

