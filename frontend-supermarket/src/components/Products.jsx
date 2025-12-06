import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/api';
import './Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');

  useEffect(() => {
    loadProducts();
  }, [categoryId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let response;
      if (categoryId) {
        response = await productService.getByCategory(categoryId);
      } else {
        response = await productService.getAll();
      }
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="products-page">
      <h1>Products</h1>
      {categoryId && <p className="category-filter">Filtered by category</p>}
      {products.length === 0 ? (
        <p>No products found</p>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <Link key={product.productId} to={`/products/${product.productId}`} className="product-card">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} />
              )}
              <div className="product-info">
                <h3>{product.name}</h3>
                {product.brand && <p className="brand">{product.brand}</p>}
                <p className="price">${product.price.toFixed(2)} / {product.unit}</p>
                {product.description && (
                  <p className="description">{product.description.substring(0, 100)}...</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
