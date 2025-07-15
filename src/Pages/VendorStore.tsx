import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import ProductCard1 from '../ALT/ProductCard1';
import "../Styles/VendorStore.css";
import defaultProductImage from "../assets/logo.webp";
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import { Product as DisplayProduct } from '../Components/Types/Product';

interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  stock: number;
  discount: string;
  discountType: string;
  size: string[];
  productImages: string[];
  status: string;
  vendorId: number;
  subcategory: {
    id: number;
    name: string;
  };
  vendor: {
    id: number;
    businessName: string;
    email: string;
    phoneNumber: string;
    districtId: number;
    district: {
      id: number;
      name: string;
    };
  };
}

interface VendorStoreResponse {
  success: boolean;
  data: {
    products: ApiProduct[];
    total: number;
  };
}

const VendorStore: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [vendorProducts, setVendorProducts] = useState<DisplayProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  useEffect(() => {
    const fetchVendorProducts = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<VendorStoreResponse>(
          `/api/vendors/${vendorId}/products?page=${page}&limit=${limit}`
        );
        if (response.data.success) {
          const transformedProducts: DisplayProduct[] = response.data.data.products.map(product => {
            // Calculate discounted price
            const basePrice = parseFloat(product.basePrice);
            const discount = parseFloat(product.discount);
            let price = basePrice;
            let originalPrice: string | undefined = undefined;
            const discountType = (product.discountType || '').toUpperCase();
            if (discount > 0 && (discountType === 'PERCENTAGE' || discountType === 'FLAT' || discountType === 'FIXED')) {
              if (discountType === 'PERCENTAGE') {
                price = basePrice - (basePrice * discount / 100);
                originalPrice = basePrice.toFixed(2);
              } else if (discountType === 'FLAT' || discountType === 'FIXED') {
                price = basePrice - discount;
                originalPrice = basePrice.toFixed(2);
              }
            }
            return {
              id: product.id,
              name: product.name,
              description: product.description,
              price: price.toFixed(2),
              originalPrice: originalPrice,
              discount: discount > 0 ? product.discount : undefined,
              rating: 0,
              ratingCount: '0',
              isBestSeller: false,
              freeDelivery: false,
              category: { id: product.subcategory.id, name: product.subcategory.name },
              subcategory: { id: product.subcategory.id, name: product.subcategory.name },
              image: product.productImages[0] || defaultProductImage,
              vendor: product.vendor.businessName,
              vendorId: product.vendorId,
              productImages: product.productImages,
              colors: [],
              memoryOptions: product.size,
              stock: product.stock,
              piece: product.stock
            };
          });
          setVendorProducts(transformedProducts);
          setTotalProducts(response.data.data.total);
        }
      } catch (error) {
        console.error('Error fetching vendor products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProducts();
  }, [vendorId, page, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalProducts / limit)) {
      setPage(newPage);
    }
  };

  // VendorStore Skeleton Loader
  const VendorStoreSkeleton: React.FC = () => (
    <>
      <div className="vendor-store__header">
        <div className="vendor-store__logo shimmer" style={{width:'4rem',height:'4rem',borderRadius:'50%'}}></div>
        <div className="vendor-store__info">
          <div className="shimmer" style={{width:'10rem',height:'1.2rem',borderRadius:'0.4rem',marginBottom:'0.5rem'}}></div>
          <div className="shimmer" style={{width:'16rem',height:'0.9rem',borderRadius:'0.4rem'}}></div>
        </div>
      </div>
      <aside className="vendor-store__details">
        <div className="shimmer" style={{width:'7rem',height:'1rem',borderRadius:'0.3rem',marginBottom:'0.7rem'}}></div>
        <div className="shimmer" style={{width:'12rem',height:'0.9rem',borderRadius:'0.3rem',marginBottom:'0.5rem'}}></div>
        <div className="shimmer" style={{width:'10rem',height:'0.9rem',borderRadius:'0.3rem',marginBottom:'0.5rem'}}></div>
        <div className="shimmer" style={{width:'8rem',height:'0.9rem',borderRadius:'0.3rem'}}></div>
      </aside>
      <main className="vendor-store__products">
        <div className="products-header">
          <div className="shimmer" style={{width:'8rem',height:'1.1rem',borderRadius:'0.3rem',marginBottom:'1rem'}}></div>
        </div>
        <div className="vendor-store__product-grid">
          {[...Array(8)].map((_,i) => (
            <div key={i} className="shimmer" style={{height:'220px',borderRadius:'0.7rem',marginBottom:'1rem'}}></div>
          ))}
        </div>
      </main>
    </>
  );

  if (loading) {
    return <VendorStoreSkeleton />;
  }

  return (
    <>
      <Navbar />
      <div className="vendor-store">
        <header className="vendor-store__header">
          <div className="vendor-store__logo" style={{ backgroundColor: '#FF6B6B' }}>
            <span className="vendor-store__logo-letter">
              {vendorProducts[0]?.vendor?.[0] || 'U'}
            </span>
          </div>
          <div className="vendor-store__info">
            <h1>{vendorProducts[0]?.vendor || 'Unknown Vendor'}</h1>
            <p className="vendor-store__description">A trusted vendor offering a wide range of products, ensuring quality and affordability.</p>
          </div>
        </header>
        
        <aside className="vendor-store__details">
          <h2 className="vendor-details__title">Vendor Details</h2>
          <div className="vendor-details__item">
            <strong>Email:</strong> <span>{vendorProducts[0]?.vendor || 'N/A'}</span>
          </div>
          <div className="vendor-details__item">
            <strong>Phone Number:</strong> <span>{vendorProducts[0]?.vendor || 'N/A'}</span>
          </div>
          <div className="vendor-details__item">
            <strong>District:</strong> <span>{vendorProducts[0]?.vendor || 'N/A'}</span>
          </div>
        </aside>
        
        <main className="vendor-store__products">
          <div className="products-header">
            <h2 className="products-title">Products ({totalProducts})</h2>
          </div>
          
          {vendorProducts.length > 0 ? (
            <div className="vendor-store__product-grid">
              {vendorProducts.map((product) => (
                <ProductCard1 key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <p>No products available for this vendor.</p>
            </div>
          )}
          
          {totalProducts > limit && (
            <div className="vendor-store__pagination">
              <button 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {Math.ceil(totalProducts / limit)}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === Math.ceil(totalProducts / limit)}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default VendorStore;