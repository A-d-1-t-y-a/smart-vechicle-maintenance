import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/api';
import './Categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="categories-page">
      <h1>Product Categories</h1>
      {categories.length === 0 ? (
        <p>No categories found</p>
      ) : (
        <div className="categories-grid">
          {categories.map(category => (
            <Link 
              key={category.categoryId} 
              to={`/products?category=${category.categoryId}`} 
              className="category-card"
            >
              {category.imageUrl && (
                <img src={category.imageUrl} alt={category.name} />
              )}
              <h3>{category.name}</h3>
              {category.description && (
                <p>{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Categories;
