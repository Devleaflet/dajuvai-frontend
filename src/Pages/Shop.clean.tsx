import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import ProductBanner from "../Components/ProductBanner";
import CategorySlider from "../Components/CategorySlider";
import ProductCard1 from "../Components/ProductCard1";
import Footer from "../Components/Footer";
import "../Styles/Shop.css";

// ... (keep all your existing interfaces and helper functions here)

const Shop: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    // Add your search logic here
  };
  
  const handleClearSearch = () => {
    setSearchInputValue("");
    setSearchQuery("");
  };
  
  const clearAllFilters = () => {
    setSearchInputValue("");
    setSearchQuery("");
    setSelectedCategory(undefined);
    setHasActiveFilters(false);
    // Reset any other filters
  };
  
  const getDisplayTitle = () => {
    return "All Products"; // Replace with your actual logic
  };
  
  const getCurrentCategoryName = () => {
    return ""; // Replace with your actual logic
  };
  
  const getCurrentSubcategoryName = () => {
    return ""; // Replace with your actual logic
  };
  
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <Navbar />
      <ProductBanner />
      <CategorySlider />
      
      <div className="shop-max-width-container">
        <div className="shop">
          {/* Mobile Filter Button */}
          <button 
            className="mobile-filter-button" 
            onClick={toggleSidebar}
            aria-label="Toggle filters"
          >
            <span className="filter-icon">⚙</span> Filters
          </button>
          
          {/* Sidebar */}
          <aside 
            ref={sidebarRef}
            className={`filter-sidebar ${isSidebarOpen ? 'open' : ''}`}
            aria-hidden={!isSidebarOpen}
          >
            <div className="filter-sidebar__header">
             <h3>Filter</h3>
              <button 
                className="filter-sidebar__close" 
                onClick={toggleSidebar} 
                aria-label="Close filters"
              >
                ×
              </button>
            </div>
            
            <div className="filter-sidebar__content">
              <h2 className="shop-title">
                {getDisplayTitle()}
                {getCurrentSubcategoryName() && (
                  <span className="subcategory-name">
                    {" > "}{getCurrentSubcategoryName()}
                  </span>
                )}
              </h2>
              
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="search-input-container">
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={handleSearchInputChange}
                    placeholder="Search for products..."
                    className="search-input"
                    aria-label="Search products"
                  />
                  {searchInputValue && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="search-clear-button"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="search-submit-button"
                  aria-label="Submit search"
                >
                  Search
                </button>
              </form>
              
              {/* Add your filter sections here */}
              
              {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters}
                  className="clear-filters-button"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="shop-content">
            <div className="products-container">
              {filteredProducts.length > 0 ? (
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard1 key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="no-products">
                  <div className="no-products-icon">📦</div>
                  <h3>No products found</h3>
                  <p>
                    {searchQuery.trim()
                      ? `No products found matching "${searchQuery}". Try adjusting your search.`
                      : selectedCategory === undefined
                      ? "No products available at the moment."
                      : `No products found in ${getCurrentCategoryName()}${
                          getCurrentSubcategoryName() ? ` > ${getCurrentSubcategoryName()}` : ""
                        }.`}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="clear-filters-button"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <Footer />
    </>
  );
};

export default Shop;
