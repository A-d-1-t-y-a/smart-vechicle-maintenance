import React, { useState } from 'react';
import { useAuth } from '../services/auth';
import { productService } from '../services/api';
import Navbar from './Navbar';
import ProductForm from './ProductForm';

function AddProducts() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState([]);

  const sampleProducts = [
    {
      name: "Wireless Bluetooth Headphones",
      description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
      price: 79.99,
      category: "electronics",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
    },
    {
      name: "Smart Watch Pro",
      description: "Fitness tracking smartwatch with heart rate monitor and GPS",
      price: 199.99,
      category: "electronics",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
    },
    {
      name: "Cotton T-Shirt",
      description: "Comfortable 100% cotton t-shirt, available in multiple colors",
      price: 24.99,
      category: "clothing",
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
    },
    {
      name: "Denim Jeans",
      description: "Classic fit denim jeans, durable and stylish",
      price: 59.99,
      category: "clothing",
      stock: 75,
      imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"
    },
    {
      name: "JavaScript: The Definitive Guide",
      description: "Comprehensive guide to JavaScript programming",
      price: 49.99,
      category: "books",
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500"
    },
    {
      name: "React Development Handbook",
      description: "Complete guide to building modern web applications with React",
      price: 39.99,
      category: "books",
      stock: 35,
      imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500"
    },
    {
      name: "Coffee Maker",
      description: "Programmable coffee maker with thermal carafe",
      price: 89.99,
      category: "home",
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1517668808823-bac4ce1a013b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=500&q=80"
    },
    {
      name: "Throw Pillow Set",
      description: "Set of 4 decorative throw pillows for your living room",
      price: 34.99,
      category: "home",
      stock: 60,
      imageUrl: "https://images.unsplash.com/photo-1584100936595-3c404ed18a45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=500&q=80"
    },
    {
      name: "Yoga Mat",
      description: "Non-slip yoga mat with carrying strap",
      price: 29.99,
      category: "sports",
      stock: 80,
      imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83d41f12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=500&q=80"
    },
    {
      name: "Dumbbell Set",
      description: "Adjustable dumbbell set, 5-50 lbs per dumbbell",
      price: 149.99,
      category: "sports",
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
    },
    {
      name: "LEGO Building Set",
      description: "Creative building blocks set for kids and adults",
      price: 44.99,
      category: "toys",
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
    },
    {
      name: "Remote Control Car",
      description: "High-speed RC car with rechargeable battery",
      price: 64.99,
      category: "toys",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=500&q=80"
    }
  ];

  async function handleAddAll() {
    if (!isAuthenticated) {
      setError('Please login first to add products');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setErrors([]);

    let successCount = 0;
    let failCount = 0;
    const errorList = [];

    for (const product of sampleProducts) {
      try {
        await productService.create(product);
        successCount++;
      } catch (err) {
        console.error(`Failed to add ${product.name}:`, err);
        failCount++;
        const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
        errorList.push(`${product.name}: ${errorMsg}`);
      }
    }

    setLoading(false);
    setErrors(errorList);
    
    if (successCount > 0) {
      setSuccess(`Successfully added ${successCount} products! ${failCount > 0 ? `(${failCount} failed)` : ''}`);
    } else {
      setError(`Failed to add products. ${failCount} errors occurred.`);
    }
  }

  async function handleFormSubmit(productData) {
    if (!isAuthenticated) {
      setError('Please login first to add products');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await productService.create(productData);
      setSuccess(`Product "${productData.name}" added successfully!`);
      setShowForm(false);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add product';
      setError(errorMsg);
      console.error('Error adding product:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error">Please login first to add products</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Add Sample Products</h1>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          This will add {sampleProducts.length} sample products to your store.
        </p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {errors.length > 0 && (
          <div className="error" style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            <strong>Errors:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {errors.map((err, idx) => (
                <li key={idx} style={{ marginBottom: '5px' }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={handleAddAll}
            disabled={loading}
            style={{ fontSize: '18px', padding: '15px 30px' }}
          >
            {loading ? 'Adding Products...' : `Add All ${sampleProducts.length} Products`}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowForm(true)}
            disabled={loading}
            style={{ fontSize: '18px', padding: '15px 30px' }}
          >
            Add Custom Product
          </button>
        </div>

        {showForm && (
          <ProductForm
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setError('');
            }}
            loading={loading}
          />
        )}

        <div style={{ marginTop: '30px' }}>
          <h3>Products to be added:</h3>
          <div className="product-grid">
            {sampleProducts.map((product, index) => (
              <div key={index} className="product-card">
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} />
                )}
                <h3>{product.name}</h3>
                <p className="price">${product.price.toFixed(2)}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>{product.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default AddProducts;
