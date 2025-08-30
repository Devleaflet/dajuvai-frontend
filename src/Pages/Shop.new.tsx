import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import ProductBanner from "../Components/ProductBanner";
import Footer from "../Components/Footer";
import { useQuery } from "@tanstack/react-query";
import { fetchReviewOf } from "../api/products";
import "../Styles/Shop.css";
import { useAuth } from "../context/AuthContext";
import ProductCard1 from "../ALT/ProductCard1";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
}

interface ProductFilters {
  categoryId?: number;
  subcategoryId?: number;
  brandId?: string;
  dealId?: string;
  sort?: string;
}

const Shop: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', selectedCategory, selectedSubcategory],
    queryFn: async () => {
      // Replace with actual API call
      return [];
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setSelectedSubcategory(null);
  };

  const handleSubcategoryChange = (subcategoryId: number) => {
    setSelectedSubcategory(subcategoryId === selectedSubcategory ? null : subcategoryId);
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery("");
  };

  const getDisplayTitle = () => {
    if (selectedCategory) {
      return `Category ${selectedCategory}`; // Replace with actual category name
    }
    return 'All Products';
  };

  const hasActiveFilters = selectedCategory !== null || selectedSubcategory !== null || searchQuery.trim() !== "";
  const filteredProducts = products; // Add actual filtering logic

  return (
    <div className="shop">
      <Navbar />
      <ProductBanner
        title={getDisplayTitle()}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          ...(selectedCategory ? [{ name: `Category ${selectedCategory}`, path: `/shop?category=${selectedCategory}` }] : []),
          ...(selectedSubcategory ? [{ name: `Subcategory ${selectedSubcategory}`, path: '' }] : [])
        ]}
      />
      
      <div className="shop-container" ref={containerRef}>
        {/* Filter Sidebar */}
        <div className={`filter-sidebar ${isSidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
          <div className="filter-sidebar__header" style={{zIndex: -111}}>
            <h3>Filters</h3>
            <button className="filter-sidebar__close-btn" onClick={toggleSidebar}>
              &times;
            </button>
          </div>
          
          {/* Add filter sections here */}
          <div className="filter-sidebar__section">
            <h4>Search</h4>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-sidebar__search-input"
            />
          </div>
          
          {hasActiveFilters && (
            <div className="filter-sidebar__section">
              <button onClick={clearAllFilters} className="clear-filters-button">
                Clear All Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="shop-content">
          <div className="shop-products">
            {isLoadingProducts ? (
              Array(8).fill(null).map((_, index) => (
                <ProductCardSkeleton key={index} count={1} />
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard1 key={product.id} product={product} />
              ))
            ) : (
              <div className="no-products">
                <div className="no-products-icon">📦</div>
                <h3>No products found</h3>
                <p>
                  {searchQuery.trim()
                    ? `No products found matching "${searchQuery}". Try adjusting your search terms.`
                    : selectedCategory
                    ? 'No products available in this category.'
                    : 'No products available at the moment.'}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="clear-filters-button">
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile filter button */}
        <button className="mobile-filter-button" onClick={toggleSidebar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Filters
        </button>
      </div>
      
      <Footer />
    </div>
  );
};

export default Shop;
