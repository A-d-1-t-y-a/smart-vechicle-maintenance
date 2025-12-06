import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { productService, inventoryService } from '../services/api';
import './ProductDetail.css';

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    loadProduct();
    loadInventory();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await productService.get(productId);
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading product:', error);
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await inventoryService.getByProduct(productId);
      setInventory(response.data);
      if (response.data.length > 0) {
        setSelectedLocation(response.data[0].locationId);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const addToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(
      item => item.productId === productId && item.locationId === selectedLocation
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId,
        productName: product.name,
        price: product.price,
        quantity,
        locationId: selectedLocation,
        imageUrl: product.imageUrl
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  const availableQuantity = inventory.find(inv => inv.locationId === selectedLocation)?.quantity || 0;

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        <div className="product-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          {product.brand && <p className="brand">Brand: {product.brand}</p>}
          <p className="price">${product.price.toFixed(2)} / {product.unit}</p>
          {product.description && <p className="description">{product.description}</p>}
          
          {inventory.length > 0 && (
            <div className="inventory-section">
              <label>Select Location:</label>
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="location-select"
              >
                {inventory.map(inv => (
                  <option key={inv.locationId} value={inv.locationId}>
                    {inv.locationId} (Available: {inv.quantity})
                  </option>
                ))}
              </select>
              <p className="availability">
                Available: {availableQuantity} {product.unit}
              </p>
            </div>
          )}

          <div className="quantity-section">
            <label>Quantity:</label>
            <input
              type="number"
              min="1"
              max={availableQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="quantity-input"
            />
          </div>

          <button 
            onClick={addToCart} 
            className="btn btn-primary"
            disabled={availableQuantity === 0 || quantity > availableQuantity}
          >
            Add to Cart
          </button>
          {availableQuantity === 0 && (
            <p className="error">Out of stock</p>
          )}
          {quantity > availableQuantity && (
            <p className="error">Insufficient quantity available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
