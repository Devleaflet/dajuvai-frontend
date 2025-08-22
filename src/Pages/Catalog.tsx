import React, { useState, useEffect } from 'react';
import ProductService from '../services/productService';
import { Product } from '../Components/Types/Product';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // Added for token

import { convertApiProductToDisplayProduct } from '../Components/Types/ApiProduct';
import { getProductPrimaryImage } from '../utils/getProductPrimaryImage';
import '../Styles/Catalog.css';

const Catalog: React.FC = () => {
  const { token } = useAuth(); // Added to support authenticated requests
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  // Using shared helper for consistent variant-first image selection across app

  const productService = ProductService.getInstance();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        (product.title || product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const apiProducts = await productService.getAllProducts(token || '');
      const data = apiProducts.map(convertApiProductToDisplayProduct);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleProductClick = (product: Product) => {
    // Navigate using product ID only; ProductPage derives category/subcategory from product
    navigate(`/product-page/${product.id}`);
  };

  const calculateDiscountedPrice = (product: Product) => {
    if (!product.discount) return Number(product.price);

    const discount = Number(product.discount);
    const price = Number(product.price);

    // Assume FLAT discount since discountType is not in Product type
    return price - discount; // Adjust if PERCENTAGE discounts are needed
  };

  if (loading) {
    return (
      <div className="catalog__loading">
        <div className="catalog__spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="catalog">
      <div className="catalog__header">
        <h1>Product Catalog</h1>
        <div className="catalog__search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearch}
            className="catalog__search-input"
          />
        </div>
      </div>

      <div className="catalog__grid">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="catalog__product-card"
            onClick={() => handleProductClick(product)}
          >
            <div className="catalog__product-image">
              <img
                src={getProductPrimaryImage(product, defaultProductImage)}
                alt={product.title || product.name || 'Product'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultProductImage;
                }}
              />
            </div>
            <div className="catalog__product-info">
              <h3 className="catalog__product-name">{product.title || product.name}</h3>
              <p className="catalog__product-description">{product.description}</p>
              <div className="product-price">
                {product.originalPrice && Number(product.originalPrice) > Number(product.price) ? (
                  <>
                    <span className="original-price">Rs. {Number(product.originalPrice).toFixed(2)}</span>
                    <span className="discounted-price">Rs. {Number(product.price).toFixed(2)}</span>
                  </>
                ) : (
                  <span className="price">Rs. {Number(product.price).toFixed(2)}</span>
                )}
              </div>
              {product.brand && (
                <span className="catalog__product-brand">{product.brand}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="catalog__no-results">
          <p>No products found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;