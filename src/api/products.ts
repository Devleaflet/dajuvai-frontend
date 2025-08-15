import axiosInstance from "./axiosInstance";

// Simple test function to debug API endpoint
export const testProductAPI = async (categoryId: number, subcategoryId: number) => {
  console.log('🧪 TESTING PRODUCT API ENDPOINT');
  console.log('Category ID:', categoryId);
  console.log('Subcategory ID:', subcategoryId);
  
  const testData = new FormData();
  testData.append('name', 'TEST_PRODUCT');
  testData.append('subcategoryId', subcategoryId.toString());
  testData.append('hasVariants', 'false');
  testData.append('basePrice', '10');
  testData.append('stock', '1');
  testData.append('status', 'AVAILABLE');
  
  const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`;
  console.log('🎯 Test API URL:', apiUrl);
  
  try {
    const response = await axiosInstance.post(apiUrl, testData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('✅ Test API Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Test API Error:', error);
    console.error('Error Response:', error.response?.data);
    throw error;
  }
};

export interface Product {
  // Add product properties here
}

export const fetchProduct = async (url: string) => {
  const response = await axiosInstance.get(url);
  return response.data.data;
};

export const fetchReviewOf = async (id: number) => {
  const cacheKey = `productReviewsData_${id}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const response = await axiosInstance.get(`/api/reviews/${id}`);
  const { averageRating, reviews } = response.data.data;

  console.log("product = :", { reviews, averageRating });

  const data = { averageRating, reviews, ratingCount: reviews.length };
  localStorage.setItem(cacheKey, JSON.stringify(data));

  return data;
};

export const uploadProductImages = async (files: File[]) => {
  try {
    console.log('=== IMAGE UPLOAD START ===');
    console.log('Files to upload:', files.length);
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await axiosInstance.post(
      '/api/product/image/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('=== IMAGE UPLOAD SUCCESS ===');
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('=== IMAGE UPLOAD ERROR ===');
    console.error('Error:', error);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Image upload failed');
  }
};

export const createProduct = async (
  categoryId: number,
  subcategoryId: number,
  productData: {
    name: string;
    description?: string;
    basePrice?: number;
    discount?: number;
    discountType?: 'PERCENTAGE' | 'FLAT';
    status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
    stock?: number;
    hasVariants: boolean;
    variants?: any[];
    dealId?: number;
    bannerId?: number;
  }
) => {
  console.log('🔥 CREATEPRODUCT FUNCTION CALLED');
  console.log('🔥 Raw params:', { categoryId, subcategoryId, productData });
  
  try {
    console.log('=== PRODUCT CREATION START ===');
    console.log('Category ID:', categoryId, 'Type:', typeof categoryId);
    console.log('Subcategory ID:', subcategoryId, 'Type:', typeof subcategoryId);
    console.log('Product Data:', JSON.stringify(productData, null, 2));
    console.log('Product Data Keys:', Object.keys(productData));
    console.log('Has Variants:', productData.hasVariants);
    
    if (productData.hasVariants && productData.variants) {
      console.log('Variants Count:', productData.variants.length);
      console.log('Variants Data:', JSON.stringify(productData.variants, null, 2));
    }
    
    // Validate required fields
    if (!productData.name) {
      throw new Error('Product name is required');
    }
    
    // Check if categoryId and subcategoryId are valid numbers
    if (!categoryId || categoryId <= 0) {
      console.error('❌ Invalid categoryId:', categoryId);
      throw new Error('Valid category ID is required');
    }
    
    if (!subcategoryId || subcategoryId <= 0) {
      console.error('❌ Invalid subcategoryId:', subcategoryId);
      throw new Error('Valid subcategory ID is required');
    }
    
    if (!productData.hasVariants) {
      // Non-variant product validation
      if (!productData.basePrice || productData.basePrice <= 0) {
        throw new Error('Base price is required for non-variant products');
      }
      if (productData.stock === undefined || productData.stock < 0) {
        throw new Error('Stock is required for non-variant products');
      }
      if (!productData.status) {
        throw new Error('Status is required for non-variant products');
      }
    } else {
      // Variant product validation
      if (!productData.variants || productData.variants.length === 0) {
        throw new Error('Variants are required for variant products');
      }
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('subcategoryId', subcategoryId.toString());
    formData.append('hasVariants', productData.hasVariants.toString());
    
    if (productData.description) {
      formData.append('description', productData.description);
    }
    
    if (!productData.hasVariants) {
      // Non-variant product fields
      if (productData.basePrice) {
        formData.append('basePrice', productData.basePrice.toString());
      }
      if (productData.stock !== undefined) {
        formData.append('stock', productData.stock.toString());
      }
      if (productData.status) {
        formData.append('status', productData.status);
      }
      if (productData.discount) {
        formData.append('discount', productData.discount.toString());
      }
      if (productData.discountType) {
        formData.append('discountType', productData.discountType);
      }
    } else {
      // Variant product fields
      formData.append('variants', JSON.stringify(productData.variants));
    }
    
    if (productData.dealId) {
      formData.append('dealId', productData.dealId.toString());
    }
    
    if (productData.bannerId) {
      formData.append('bannerId', productData.bannerId.toString());
    }
    
    // Log all FormData entries
    console.log('=== FINAL FORM DATA ENTRIES ===');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`;
    console.log('=== MAKING API REQUEST ===');
    console.log('API URL:', apiUrl);
    console.log('Request Method: POST');
    console.log('Content-Type: multipart/form-data');
    console.log('FormData size:', Array.from(formData.entries()).length, 'entries');
    
    // Test if the endpoint exists first
    console.log('🧪 Testing API endpoint accessibility...');
    
    // Try a simple test first to see if the endpoint is reachable
    try {
      console.log('🔍 Testing with minimal data...');
      const testFormData = new FormData();
      testFormData.append('name', 'TEST_PRODUCT');
      testFormData.append('subcategoryId', subcategoryId.toString());
      testFormData.append('hasVariants', 'false');
      testFormData.append('basePrice', '10');
      testFormData.append('stock', '1');
      testFormData.append('status', 'AVAILABLE');
      
      console.log('🧪 Test FormData entries:');
      for (const [key, value] of testFormData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      // Use the test data instead of the full form data for now
      console.log('🚀 Making test API call...');
    } catch (testError) {
      console.error('❌ Test setup failed:', testError);
    }
    
    // Make the API call
    const response = await axiosInstance.post(
      apiUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      }
    );
    
    console.log('=== PRODUCT CREATION SUCCESS ===');
    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error('=== PRODUCT CREATION ERROR ===');
    console.error('Error Type:', typeof error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error Object:', error);
    
    if (error.response) {
      console.error('=== ERROR RESPONSE DETAILS ===');
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
      console.error('Config:', error.response.config);
      
      if (error.response.status === 401) {
        throw new Error('Unauthorized: Please login again');
      } else if (error.response.status === 400) {
        const errorMsg = error.response?.data?.message || 'Bad request - please check your input data';
        console.error('400 Error Message:', errorMsg);
        throw new Error(errorMsg);
      } else if (error.response.status === 404) {
        const errorMsg = error.response?.data?.message || 'Category or subcategory not found';
        console.error('404 Error Message:', errorMsg);
        throw new Error(errorMsg);
      } else if (error.response.status === 500) {
        const errorMsg = error.response?.data?.message || 'Internal Server Error';
        console.error('500 Error Message:', errorMsg);
        throw new Error(errorMsg);
      } else if (error.response?.data?.message) {
        console.error('API Error Message:', error.response.data.message);
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      console.error('=== REQUEST ERROR (No Response) ===');
      console.error('Request:', error.request);
      throw new Error('Network error: No response from server');
    } else {
      console.error('=== SETUP ERROR ===');
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

export const updateProduct = async (
  productId: number,
  categoryId: number,
  subcategoryId: number,
  productData: {
    name: string;
    description?: string;
    basePrice?: number;
    discount?: number;
    discountType?: 'PERCENTAGE' | 'FLAT';
    status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
    stock?: number;
    hasVariants: boolean;
    variants?: any[];
    dealId?: number;
    bannerId?: number;
  }
) => {
  try {
    console.log(`Updating product ${productId} with data:`, productData);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('subcategoryId', subcategoryId.toString());
    formData.append('hasVariants', productData.hasVariants.toString());
    
    if (productData.description) {
      formData.append('description', productData.description);
    }
    
    if (!productData.hasVariants) {
      // Non-variant product fields
      if (productData.basePrice) {
        formData.append('basePrice', productData.basePrice.toString());
      }
      if (productData.stock !== undefined) {
        formData.append('stock', productData.stock.toString());
      }
      if (productData.status) {
        formData.append('status', productData.status);
      }
      if (productData.discount) {
        formData.append('discount', productData.discount.toString());
      }
      if (productData.discountType) {
        formData.append('discountType', productData.discountType);
      }
    } else {
      // Variant product fields
      formData.append('variants', JSON.stringify(productData.variants));
    }
    
    if (productData.dealId) {
      formData.append('dealId', productData.dealId.toString());
    }
    
    if (productData.bannerId) {
      formData.append('bannerId', productData.bannerId.toString());
    }
    
    console.log('Making API request to update product:', `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`);

    const response = await axiosInstance.put(
      `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Product updated successfully:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { status?: number; data?: any } };
      console.error('Error updating product:', err.response?.data || error);
      if (err.response?.status === 403) {
        const errorMessage = err.response?.data?.message || 'Not authorized to update this product. You can only update products you own.';
        throw new Error(errorMessage);
      } else if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (err.response?.status === 404) {
        throw new Error('Product not found or you do not have permission to access it.');
      } else if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }
    throw error;
  }
};

export const deleteProduct = async (
  productId: number,
  categoryId: number,
  subcategoryId: number,
  token?: string
) => {
  try {
    // Prepare headers
    const headers: any = {};

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axiosInstance.delete(
      `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`,
      { headers }
    );
    
    console.log('Product deleted successfully:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { status?: number; data?: any } };
      console.error('Error deleting product:', err.response?.data || error);
      if (err.response?.status === 403) {
        throw new Error('Not authorized to delete this product. You can only delete products you own.');
      } else if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (err.response?.status === 404) {
        throw new Error('Product not found.');
      }
    }
    throw error;
  }
};

export const fetchProducts = async (
  vendorId: number,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const response = await axiosInstance.get(`/api/vendors/${vendorId}/products`, {
      params: {
        page,
        limit
      }
    });
    return response;
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Enhanced axios interceptor setup with better error handling
export const setupAxiosInterceptors = (
  getTokenFn: () => string | null,
  logoutFn?: () => void,
  refreshTokenFn?: () => Promise<void>
) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getTokenFn?.();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log('Request config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        hasAuth: !!config.headers.Authorization
      });
      
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling auth errors
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      console.error('Response interceptor error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          headers: error?.config?.headers
        }
      });

      const originalRequest = error.config;
      if (
        error?.response?.status === 401 &&
        refreshTokenFn &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          await refreshTokenFn();
          // After refreshing, retry the original request
          const token = getTokenFn?.();
          if (token) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          if (logoutFn) {
            logoutFn();
          }
          return Promise.reject(refreshError);
        }
      }

      // Handle authentication errors (if refreshTokenFn not provided or failed)
      if (error?.response?.status === 401) {
        console.warn('Authentication failed, logging out...');
        if (logoutFn) {
          logoutFn();
        }
      }

      return Promise.reject(error);
    }
  );
};