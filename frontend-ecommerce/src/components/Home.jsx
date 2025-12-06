import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { productService } from '../services/api';
import Navbar from './Navbar';

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const categories = ['all', 'electronics', 'clothing', 'books', 'home', 'sports', 'toys'];

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ marginBottom: '20px' }}>Welcome to Our Store</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px' }}>Filter by Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px', fontSize: '16px' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Check back later for new products!</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.slice(0, 8).map(product => (
              <div
                key={product.productId}
                className="product-card"
                onClick={() => navigate(`/products/${product.productId}`)}
              >
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} />
                )}
                <h3>{product.name}</h3>
                <p className="price">${parseFloat(product.price).toFixed(2)}</p>
                {product.stock > 0 ? (
                  <span style={{ color: '#28a745' }}>In Stock</span>
                ) : (
                  <span style={{ color: '#dc3545' }}>Out of Stock</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/products')}
          >
            View All Products
          </button>
        </div>
      </div>
    </>
  );
}

export default Home;
