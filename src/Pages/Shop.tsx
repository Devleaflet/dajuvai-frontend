import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import ProductBanner from "../Components/ProductBanner";
import CategorySlider from "../Components/CategorySlider";
import Footer from "../Components/Footer";
import { useQuery } from "@tanstack/react-query";
import { fetchReviewOf } from "../api/products";
import phone from "../assets/phone.png";
import '../Styles/Shop.css';
import CategoryService from "../services/categoryService";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../Components/Types/Product";
import ProductCard1 from "../ALT/ProductCard1";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import { API_BASE_URL } from "../config";

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
  categoryId?: number | undefined;
  subcategoryId?: number | undefined;
  brandId?: string | undefined;
  dealId?: string | undefined;
  sort?: string | undefined;
}

// Unified API fetch function
const apiRequest = async (endpoint: string, token: string | null | undefined = undefined) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const textResponse = await response.text();
    
    if (textResponse.trim().startsWith('<!doctype html') || textResponse.trim().startsWith('<html')) {
      throw new Error(`API endpoint not found. The server returned HTML instead of JSON.`);
    }
    
    throw new Error(`Expected JSON response but received ${contentType}`);
  }
  
  return await response.json();
};

// Build query parameters for the API
const buildQueryParams = (filters: ProductFilters): string => {
  const params = new URLSearchParams();
  if (filters.categoryId !== undefined) {
    params.append('categoryId', filters.categoryId.toString());
  }
  if (filters.subcategoryId !== undefined) {
    params.append('subcategoryId', filters.subcategoryId.toString());
  }
  if (filters.brandId !== undefined) {
    params.append('brandId', filters.brandId);
  }
  if (filters.dealId !== undefined) {
    params.append('dealId', filters.dealId);
  }
  if (filters.sort !== undefined && filters.sort !== 'all') {
    params.append('sort', filters.sort);
  }
  return params.toString();
};

// Fetch products with filters
const fetchProductsWithFilters = async (filters: ProductFilters, token: string | null | undefined = undefined) => {
  const queryParams = buildQueryParams(filters);
  const endpoint = `/api/categories/all/products${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint, token);
};

const Shop: React.FC = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInputValue, setSearchInputValue] = useState<string>('');

  // Use refs to track previous values and prevent unnecessary updates
  const prevSearchQueryRef = useRef<string>('');
  const prevSearchInputValueRef = useRef<string>('');
  const prevSelectedCategoryRef = useRef<number | undefined>(undefined);
  const prevSelectedSubcategoryRef = useRef<number | undefined>(undefined);

  // Initialize filters from URL parameters
  useEffect(() => {
    const categoryIdParam = searchParams.get('categoryId');
    const subcategoryIdParam = searchParams.get('subcategoryId');
    const searchParam = searchParams.get('search');
    
    // console.log('🏪 Shop useEffect triggered with searchParams:', {
    //   categoryIdParam,
    //   subcategoryIdParam,
    //   searchParam,
    //   allParams: Object.fromEntries(searchParams.entries())
    // });
    
    // Only update category if it's different from previous value
    const newCategoryId = categoryIdParam ? Number(categoryIdParam) : undefined;
    if (newCategoryId !== prevSelectedCategoryRef.current) {
      setSelectedCategory(newCategoryId);
      prevSelectedCategoryRef.current = newCategoryId;
    }
    
    // Only update subcategory if it's different from previous value
    const newSubcategoryId = subcategoryIdParam ? Number(subcategoryIdParam) : undefined;
    if (newSubcategoryId !== prevSelectedSubcategoryRef.current) {
      setSelectedSubcategory(newSubcategoryId);
      prevSelectedSubcategoryRef.current = newSubcategoryId;
    }

    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam);
      // console.log('🔍 Setting search values:', {
      //   original: searchParam,
      //   decoded: decodedSearch
      // });
      // Only update if the search value is different from previous values
      if (decodedSearch !== prevSearchQueryRef.current) {
        setSearchQuery(decodedSearch);
        prevSearchQueryRef.current = decodedSearch;
      }
      if (decodedSearch !== prevSearchInputValueRef.current) {
        setSearchInputValue(decodedSearch);
        prevSearchInputValueRef.current = decodedSearch;
      }
    } else {
      // console.log('❌ No search parameter found, clearing search values');
      // Only clear if the values are not already empty
      if (prevSearchQueryRef.current !== '') {
        setSearchQuery('');
        prevSearchQueryRef.current = '';
      }
      if (prevSearchInputValueRef.current !== '') {
        setSearchInputValue('');
        prevSearchInputValueRef.current = '';
      }
    }
  }, [searchParams]); // Only depend on searchParams to prevent infinite loops

  // Listen for custom events from CategorySlider
  useEffect(() => {
    const handleShopFiltersChanged = (event: CustomEvent) => {
      const { categoryId, subcategoryId } = event.detail;
      
      // Update URL parameters instead of directly setting state
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (categoryId) {
        newSearchParams.set('categoryId', categoryId.toString());
      } else {
        newSearchParams.delete('categoryId');
      }
      
      if (subcategoryId) {
        newSearchParams.set('subcategoryId', subcategoryId.toString());
      } else {
        newSearchParams.delete('subcategoryId');
      }
      
      // Clear search when changing categories
      newSearchParams.delete('search');
      
      setSearchParams(newSearchParams);
    };

    window.addEventListener('shopFiltersChanged', handleShopFiltersChanged as EventListener);

    return () => {
      window.removeEventListener('shopFiltersChanged', handleShopFiltersChanged as EventListener);
    };
  }, [searchParams]);

  // Current filters object
  const currentFilters: ProductFilters = {
    categoryId: selectedCategory,
    subcategoryId: selectedSubcategory,
    sort: sortBy,
  };

  // Query for categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/categories", token);
        if (Array.isArray(response)) return response;
        if (response?.success && Array.isArray(response.data)) return response.data;
        if (response?.data) return Array.isArray(response.data) ? response.data : [];
        return [];
      } catch (error) {
        const categoryService = CategoryService.getInstance();
        return await categoryService.getAllCategories(token || undefined);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for subcategories
  const { data: subcategories = [], isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      try {
        const response = await apiRequest(`/api/categories/${selectedCategory}/subcategories`, token);
        if (response?.success && Array.isArray(response.data)) {
          return response.data.map((item: any) => ({
            id: item.id,
            name: item.name
          })).filter((item: Subcategory) => item.id && item.name);
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for products with filters
  const { 
    data: productsData, 
    isLoading: isLoadingProducts, 
    error: productsError
  } = useQuery({
    queryKey: ["products", currentFilters],
    queryFn: async () => {
      const response = await fetchProductsWithFilters(currentFilters, token);
      let productsArray: any[] = [];
      
      if (response?.success && Array.isArray(response.data)) {
        productsArray = response.data;
      } else if (Array.isArray(response)) {
        productsArray = response;
      }

      // Process products with review data
      return await Promise.all(productsArray.map(async (item) => {
        return await processProductWithReview(item);
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Client-side filtering for price and search
  const filteredProducts = (productsData || []).filter((product) => {
    // Price filtering
    if (selectedPriceRange) {
      const maxPrice = parseFloat(selectedPriceRange);
      const productPrice = typeof product.price === 'string' 
        ? parseFloat(product.price.replace(/[^0-9.]/g, ""))
        : parseFloat(String(product.price));
      if (isNaN(productPrice) || productPrice > maxPrice) {
        return false;
      }
    }

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const productName = product.title?.toLowerCase() || '';
      const productDescription = product.description?.toLowerCase() || '';
      const productCategory = product.category?.toLowerCase() || '';
      const productBrand = product.brand?.toLowerCase() || '';
      
      return productName.includes(query) || 
             productDescription.includes(query) || 
             productCategory.includes(query) || 
             productBrand.includes(query);
    }

    return true;
  });

  // Event handlers
  const handleCategoryChange = (categoryId: number | undefined): void => {
    // Update URL parameters instead of directly setting state
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (categoryId) {
      newSearchParams.set('categoryId', categoryId.toString());
    } else {
      newSearchParams.delete('categoryId');
    }
    
    // Clear subcategory when changing category
    newSearchParams.delete('subcategoryId');
    
    // Clear search when changing categories
    newSearchParams.delete('search');
    
    setSearchParams(newSearchParams);
  };

  const handleSubcategoryChange = (subcategoryId: number | undefined): void => {
    // Update URL parameters instead of directly setting state
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (subcategoryId) {
      newSearchParams.set('subcategoryId', subcategoryId.toString());
    } else {
      newSearchParams.delete('subcategoryId');
    }
    
    setSearchParams(newSearchParams);
  };

  const handleSortChange = (newSort: string | undefined): void => {
    setSortBy(newSort || 'all');
  };

  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const clearAllFilters = (): void => {
    setSelectedPriceRange(undefined);
    setSortBy('all');
    setSearchInputValue('');
    
    // Clear URL parameters - let useEffect handle state updates
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams);
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchInputValue.trim();
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (trimmedSearch) {
      newSearchParams.set('search', encodeURIComponent(trimmedSearch));
    } else {
      newSearchParams.delete('search');
    }
    
    // Clear category filters when searching
    newSearchParams.delete('categoryId');
    newSearchParams.delete('subcategoryId');
    
    setSearchParams(newSearchParams);
    // Remove direct state update - let useEffect handle it
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInputValue('');
    // Remove direct state update - let useEffect handle it
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    setSearchParams(newSearchParams);
  };

  // Helper functions
  const getCurrentCategoryName = (): string => {
    if (selectedCategory === undefined) return "All Categories";
    const category = categories.find((cat: Category) => cat.id === selectedCategory);
    return category ? category.name : "Selected Category";
  };

  const getCurrentSubcategoryName = (): string | undefined => {
    if (selectedSubcategory === undefined) return undefined;
    const subcategory = subcategories.find((sub: Subcategory) => sub.id === selectedSubcategory);
    return subcategory ? subcategory.name : "Selected Subcategory";
  };

  // Get display title based on search or category
  const getDisplayTitle = (): string => {
    if (searchQuery.trim()) {
      return `Search Results for "${searchQuery}"`;
    }
    return getCurrentCategoryName();
  };

  // Constants
  const hasActiveFilters = selectedCategory !== undefined || 
                         selectedSubcategory !== undefined || 
                         selectedPriceRange !== undefined || 
                         sortBy !== 'all' ||
                         searchQuery.trim() !== '';

  // Update the product processing
  const processProductWithReview = async (item: any): Promise<Product> => {
    try {
      const { averageRating, reviews } = await fetchReviewOf(item.id);
      
      return {
        id: item.id,
        title: item.name,
        description: item.description,
        originalPrice: item.basePrice.toString(),
        discountPercentage: `${item.discount}%`,
        price: (item.basePrice * (1 - item.discount / 100)).toFixed(2),
        rating: Number(averageRating) || 0,
        ratingCount: reviews?.length?.toString() || "0",
        isBestSeller: item.stock > 20,
        freeDelivery: true,
        image: item.productImages?.[0] || phone,
        category: item.subcategory?.category?.name || item.category || "Misc",
        brand: item.brand?.name || item.brand || "Unknown",
      };
    } catch (error) {
      // Fallback product data without reviews
      return {
        id: item.id,
        title: item.name,
        description: item.description,
        originalPrice: item.basePrice.toString(),
        discountPercentage: `${item.discount}%`,
        price: (item.basePrice * (1 - item.discount / 100)).toFixed(2),
        rating: 0,
        ratingCount: "0",
        isBestSeller: item.stock > 20,
        freeDelivery: true,
        image: item.productImages?.[0] || phone,
        category: item.subcategory?.category?.name || item.category || "Misc",
        brand: item.brand?.name || item.brand || "Unknown",
      };
    }
  };

  // Error states
  if (productsError) {
    return (
      <div className="shop-error">
        <Navbar />
        <div className="error-message" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          margin: '2rem',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Unable to Load Products</h2>
          <p style={{ marginBottom: '1rem' }}>
            {productsError instanceof Error ? productsError.message : 'Unknown error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <ProductBanner />
      <CategorySlider />
      
      {/* Search Bar */}
      <div className="search-bar-container">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className={`search-input-container ${searchInputValue ? 'has-clear-button' : ''}`}>
            <input
              type="text"
              value={searchInputValue}
              onChange={handleSearchInputChange}
              placeholder="Search for products, brands, or categories..."
              className="search-input"
            />
            {searchInputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="search-clear-button"
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      <div className="shop-container">
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem 0',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          width: '100%'
        }}>
          <h2 style={{
            fontSize: '2rem',
            margin: '0',
            color: '#222',
            fontWeight: '700',
            letterSpacing: '-1px'
          }}>
            {getDisplayTitle()}
            {getCurrentSubcategoryName() && (
              <span style={{
                fontSize: '1.1rem',
                color: '#666',
                fontWeight: 'normal',
                marginLeft: '0.5rem'
              }}>
                {' > '}{getCurrentSubcategoryName()}
              </span>
            )}
          </h2>
          <div style={{
            fontSize: '1rem',
            color: '#666',
            backgroundColor: '#f8f9fa',
            padding: '0.5rem 1rem',
            borderRadius: '6px'
          }}>
            {isLoadingProducts ? 'Loading...' : `${filteredProducts.length} products`}
          </div>
        </div>
        <div className="shop-content">
          <div className="shop">
            <button 
              className="filter-button" 
              onClick={toggleSidebar}
              aria-label="Toggle filters"
            >
              <span className="filter-icon">⚙</span>
            </button>
            
            {isSidebarOpen && (
              <div 
                className="filter-sidebar-overlay" 
                onClick={toggleSidebar}
                aria-label="Close filters"
              />
            )}
            
            <div className={`filter-sidebar ${isSidebarOpen ? "open" : ""}`} key={`${selectedCategory}-${selectedSubcategory}-${selectedPriceRange}-${sortBy}`}>
              <div className="filter-sidebar__header">
                <h3>Filters</h3>
                <button 
                  className="filter-sidebar__close" 
                  onClick={toggleSidebar}
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>

              {hasActiveFilters && (
                <div className="filter-sidebar__section">
                  <button 
                    onClick={clearAllFilters}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#ff6b00',
                      border: '1px solid #ff6b00',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      color: 'white',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e05a00';
                      e.currentTarget.style.borderColor = '#e05a00';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff6b00';
                      e.currentTarget.style.borderColor = '#ff6b00';
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {searchQuery.trim() && (
                <div className="filter-sidebar__section">
                  <h4 className="filter-sidebar__section-title">Search</h4>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    fontSize: '0.9rem',
                    color: '#495057'
                  }}>
                    <strong>Searching for:</strong> "{searchQuery}"
                  </div>
                </div>
              )}

              <div className="filter-sidebar__section">
                <h4 className="filter-sidebar__section-title">Sort By</h4>
                <div className="filter-sidebar__radio-list">
                  {[
                    { value: 'all', label: 'Default' },
                    { value: 'low-to-high', label: 'Price: Low to High' },
                    { value: 'high-to-low', label: 'Price: High to Low' }
                  ].map((option) => (
                    <div key={option.value} className="filter-sidebar__radio-item">
                      <input
                        type="radio"
                        id={`sort-${option.value}`}
                        name="sort"
                        checked={sortBy === option.value}
                        onChange={() => handleSortChange(option.value)}
                      />
                      <label htmlFor={`sort-${option.value}`}>{option.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-sidebar__section">
                <h4 className="filter-sidebar__section-title">Categories</h4>
                <div className="filter-sidebar__checkbox-list">
                  {isLoadingCategories ? (
                    <p className="filter-sidebar__loading">Loading categories...</p>
                  ) : (
                    <>
                      <div className="filter-sidebar__checkbox-item">
                        <input
                          type="radio"
                          id="category-all"
                          name="category"
                          checked={selectedCategory === undefined}
                          onChange={() => handleCategoryChange(undefined)}
                        />
                        <label htmlFor="category-all">All Categories</label>
                      </div>
                      {categories.map((category: Category) => (
                        <div key={category.id} className="filter-sidebar__category-group">
                          <div className="filter-sidebar__checkbox-item">
                            <input
                              type="radio"
                              id={`category-${category.id}`}
                              name="category"
                              checked={selectedCategory === category.id}
                              onChange={() => handleCategoryChange(category.id)}
                            />
                            <label htmlFor={`category-${category.id}`}>{category.name}</label>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {selectedCategory !== undefined && (
                <div className="filter-sidebar__section">
                  <h4 className="filter-sidebar__section-title">Subcategories</h4>
                  <div className="filter-sidebar__checkbox-list">
                    {isLoadingSubcategories ? (
                      <p className="filter-sidebar__loading">Loading subcategories...</p>
                    ) : subcategories.length > 0 ? (
                      <>
                        <div className="filter-sidebar__checkbox-item">
                          <input
                            type="radio"
                            id="subcategory-all"
                            name="subcategory"
                            checked={selectedSubcategory === undefined}
                            onChange={() => handleSubcategoryChange(undefined)}
                          />
                          <label htmlFor="subcategory-all">All Subcategories</label>
                        </div>
                        {subcategories.map((subcategory: Subcategory) => (
                          <div key={subcategory.id} className="filter-sidebar__checkbox-item">
                            <input
                              type="radio"
                              id={`subcategory-${subcategory.id}`}
                              name="subcategory"
                              checked={selectedSubcategory === subcategory.id}
                              onChange={() => handleSubcategoryChange(subcategory.id)}
                            />
                            <label htmlFor={`subcategory-${subcategory.id}`}>{subcategory.name}</label>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="filter-sidebar__no-data">No subcategories available</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="shop-products" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {isLoadingProducts ? (
                Array(8).fill(null).map((_, index) => (
                  <ProductCardSkeleton key={index} count={1} />
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard1 key={product.id} product={product} />
                ))
              ) : (
                <div className="no-products" style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  margin: '2rem 0',
                  gridColumn: '1 / -1'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    opacity: 0.3,
                    animation: 'bounce 1s infinite'
                  }}>
                    📦
                  </div>
                  <h3 style={{
                    color: '#333',
                    marginBottom: '0.75rem',
                    fontSize: '1.5rem'
                  }}>
                    No products found
                  </h3>
                  <p style={{
                    color: '#666',
                    marginBottom: '1.5rem',
                    fontSize: '1rem',
                    maxWidth: '400px',
                    margin: '0 auto 1.5rem'
                  }}>
                    {searchQuery.trim()
                      ? `No products found matching "${searchQuery}". Try adjusting your search terms or browse categories.`
                      : selectedCategory === undefined
                      ? "No products available at the moment."
                      : `No products found in ${getCurrentCategoryName()}${getCurrentSubcategoryName() ? ` > ${getCurrentSubcategoryName()}` : ''}.`
                    }
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#ff6b00',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e05a00';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff6b00';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Shop;