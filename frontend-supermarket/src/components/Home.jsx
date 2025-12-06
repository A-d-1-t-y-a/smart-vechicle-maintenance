import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService, productService } from '../services/api';
import './Home.css';

function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        categoryService.getAll(),
        productService.getAll()
      ]);
      setCategories(categoriesRes.data.slice(0, 6));
      setFeaturedProducts(productsRes.data.slice(0, 8));
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to Retail Supermarket</h1>
        <p>Your one-stop shop for all your grocery needs</p>
        <Link to="/products" className="btn btn-primary">Shop Now</Link>
      </section>

      <section className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <Link key={category.categoryId} to={`/products?category=${category.categoryId}`} className="category-card">
              {category.imageUrl && <img src={category.imageUrl} alt={category.name} />}
              <h3>{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <h2>Featured Products</h2>
        <div className="products-grid">
          {featuredProducts.map(product => (
            <Link key={product.productId} to={`/products/${product.productId}`} className="product-card">
              {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
              <h3>{product.name}</h3>
              <p className="price">${product.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
        <Link to="/products" className="btn btn-secondary">View All Products</Link>
      </section>
    </div>
  );
}

export default Home;
