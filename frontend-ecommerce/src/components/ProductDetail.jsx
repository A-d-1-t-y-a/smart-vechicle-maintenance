import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { productService, cartService } from '../services/api';
import Navbar from './Navbar';

function ProductDetail() {
  const { productId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      const response = await productService.get(productId);
      setProduct(response.data);
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (quantity < 1 || quantity > product.stock) {
      setError('Invalid quantity');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await cartService.add({ productId, quantity });
      setSuccess('Product added to cart!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add to cart');
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading">Loading product...</div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error">Product not found</div>
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>
            Back to Products
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <button className="btn btn-secondary" onClick={() => navigate('/products')} style={{ marginBottom: '20px' }}>
          ← Back to Products
        </button>

        <div className="card" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                style={{ width: '100%', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '400px', 
                background: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                No Image Available
              </div>
            )}
          </div>

          <div style={{ flex: '1', minWidth: '300px' }}>
            <h1>{product.name}</h1>
            <p className="price" style={{ fontSize: '32px', margin: '20px 0' }}>
              ${parseFloat(product.price).toFixed(2)}
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <strong>Category:</strong> {product.category}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Stock:</strong>{' '}
              {product.stock > 0 ? (
                <span style={{ color: '#28a745' }}>{product.stock} available</span>
              ) : (
                <span style={{ color: '#dc3545' }}>Out of Stock</span>
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3>Description</h3>
              <p>{product.description || 'No description available.'}</p>
            </div>

            {product.stock > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  <strong>Quantity:</strong>
                </label>
                <div className="quantity-control">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {product.stock > 0 ? (
                <button
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  style={{ flex: 1 }}
                >
                  Add to Cart
                </button>
              ) : (
                <button className="btn btn-secondary" disabled style={{ flex: 1 }}>
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetail;
