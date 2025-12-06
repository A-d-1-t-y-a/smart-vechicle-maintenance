import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { productService } from '../services/api';
import Navbar from './Navbar';

function ProductList() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  async function loadProducts() {
    try {
      setLoading(true);
      let response;
      if (selectedCategory === 'all') {
        response = await productService.getAll();
      } else {
        response = await productService.getByCategory(selectedCategory);
      }
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['all', 'electronics', 'clothing', 'books', 'home', 'sports', 'toys', 'general'];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Products</h1>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try a different search term or category</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div
                key={product.productId}
                className="product-card"
                onClick={() => navigate(`/products/${product.productId}`)}
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    background: '#f0f0f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}>
                    No Image
                  </div>
                )}
                <h3>{product.name}</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                  {product.description.substring(0, 100)}...
                </p>
                <p className="price">${parseFloat(product.price).toFixed(2)}</p>
                <div style={{ marginTop: '10px' }}>
                  {product.stock > 0 ? (
                    <span style={{ color: '#28a745' }}>✓ In Stock ({product.stock} available)</span>
                  ) : (
                    <span style={{ color: '#dc3545' }}>✗ Out of Stock</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ProductList;
