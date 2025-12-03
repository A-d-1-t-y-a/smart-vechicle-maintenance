import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function PartsForm() {
  const { partId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    description: '',
    vehicleModel: '',
    category: '',
    unitPrice: '',
    reorderThreshold: '',
    currentStock: '',
    supplier: ''
  });

  useEffect(() => {
    if (partId) {
      loadPart();
    }
  }, [partId]);

  const loadPart = async () => {
    try {
      const response = await api.get(`/parts/${partId}`);
      const part = response.data;
      setFormData({
        partName: part.partName || '',
        partNumber: part.partNumber || '',
        description: part.description || '',
        vehicleModel: part.vehicleModel || '',
        category: part.category || '',
        unitPrice: part.unitPrice || '',
        reorderThreshold: part.reorderThreshold || '',
        currentStock: part.currentStock || '',
        supplier: part.supplier || ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load part');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        reorderThreshold: parseInt(formData.reorderThreshold) || 0,
        currentStock: parseInt(formData.currentStock) || 0
      };

      if (partId) {
        await api.put(`/parts/${partId}`, data);
      } else {
        await api.post('/parts', data);
      }
      navigate('/parts');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>{partId ? 'Edit Part' : 'Add New Part'}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Part Name *</label>
            <input
              type="text"
              name="partName"
              value={formData.partName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Part Number</label>
            <input
              type="text"
              name="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Vehicle Model</label>
            <input
              type="text"
              name="vehicleModel"
              value={formData.vehicleModel}
              onChange={handleChange}
              placeholder="e.g., Toyota Camry, or leave blank for ALL"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Engine, Brakes, Filters"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Unit Price ($)</label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Current Stock</label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Reorder Threshold</label>
            <input
              type="number"
              name="reorderThreshold"
              value={formData.reorderThreshold}
              onChange={handleChange}
              min="0"
              placeholder="Alert when stock falls below this number"
            />
          </div>

          <div className="form-group">
            <label>Supplier</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : partId ? 'Update Part' : 'Create Part'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/parts')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PartsForm;

