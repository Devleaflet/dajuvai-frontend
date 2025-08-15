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

export const uploadProductImages = async (files: File[]): Promise<{ success: boolean; urls: string[]; message?: string }> => {
  try {
    console.log('=== UPLOAD PRODUCT IMAGES START ===');
    console.log('Files to upload:', files.length);

    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`Adding file ${index + 1}:`, file.name, file.type, file.size);
      formData.append('files', file);
    });

    console.log('=== MAKING UPLOAD REQUEST ===');
    const response = await axiosInstance.post('/api/product/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('=== UPLOAD SUCCESS ===');
    console.log('Response:', response.data);

    // API returns { success: true, urls: [...] }
    if (response.data.success && response.data.urls) {
      return {
        success: true,
        urls: response.data.urls,
        message: 'Images uploaded successfully'
      };
    } else {
      throw new Error('Invalid response format from upload endpoint');
    }

  } catch (error: any) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error details:', error);
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);

    return {
      success: false,
      urls: [],
      message: error.response?.data?.message || error.message || 'Failed to upload images'
    };
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
    productImages?: string[]; // URLs from Cloudinary
  }
) => {
  console.log('🔥 CREATE PRODUCT - NEW JSON API CONTRACT');
  console.log('Category ID:', categoryId, 'Type:', typeof categoryId);
  console.log('Subcategory ID:', subcategoryId, 'Type:', typeof subcategoryId);
  console.log('Product Data:', JSON.stringify(productData, null, 2));
  
  try {
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
    
    // Prepare JSON payload according to new API contract
    const payload: any = {
      name: productData.name,
      subcategoryId: subcategoryId,
      hasVariants: productData.hasVariants,
    };

    // Add optional fields
    if (productData.description) payload.description = productData.description;
    if (productData.discount !== undefined) payload.discount = productData.discount;
    if (productData.discountType) payload.discountType = productData.discountType;
    if (productData.dealId) payload.dealId = productData.dealId;
    if (productData.bannerId) payload.bannerId = productData.bannerId;
    if (productData.productImages && productData.productImages.length > 0) {
      payload.productImages = productData.productImages;
    }

    // Add fields based on whether product has variants
    if (productData.hasVariants) {
      if (productData.variants && productData.variants.length > 0) {
        payload.variants = productData.variants;
      }
    } else {
      // For non-variant products, these fields are required
      payload.basePrice = productData.basePrice;
      payload.stock = productData.stock;
      payload.status = productData.status;
    }

    const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`;
    console.log('🎯 API URL:', apiUrl);
    console.log('📤 Making JSON POST request...');

    // Make the JSON POST API call according to new contract
    const response = await axiosInstance.post(
      apiUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
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

// Update product function to match new API contract
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
    productImages?: string[];
  }
) => {
  console.log('🔄 UPDATING PRODUCT');
  console.log('Product ID:', productId);
  console.log('Category ID:', categoryId);
  console.log('Subcategory ID:', subcategoryId);
  console.log('Product Data:', productData);

  try {
    // Prepare the JSON payload
    const payload: any = {
      name: productData.name,
      subcategoryId: subcategoryId,
      hasVariants: productData.hasVariants,
    };

    // Add optional fields
    if (productData.description) payload.description = productData.description;
    if (productData.discount !== undefined) payload.discount = productData.discount;
    if (productData.discountType) payload.discountType = productData.discountType;
    if (productData.dealId) payload.dealId = productData.dealId;
    if (productData.bannerId) payload.bannerId = productData.bannerId;
    if (productData.productImages) payload.productImages = productData.productImages;

    // Add fields based on whether product has variants
    if (productData.hasVariants) {
      if (productData.variants && productData.variants.length > 0) {
        payload.variants = productData.variants;
      }
    } else {
      // For non-variant products, these fields are required
      if (productData.basePrice !== undefined) payload.basePrice = productData.basePrice;
      if (productData.stock !== undefined) payload.stock = productData.stock;
      if (productData.status) payload.status = productData.status;
    }

    console.log('📤 Final Update Payload:', JSON.stringify(payload, null, 2));

    const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`;
    console.log('🎯 Update API URL:', apiUrl);

    const response = await axiosInstance.put(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Product Updated Successfully:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Product updated successfully'
    };

  } catch (error: any) {
    console.error('❌ UPDATE PRODUCT ERROR:', error);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
      
      // Handle specific error cases
      if (error.response.status === 400) {
        throw new Error(`Bad Request: ${error.response.data?.message || 'Invalid product data'}`);
      } else if (error.response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.response.status === 403) {
        throw new Error('Not authorized to update this product.');
      } else if (error.response.status === 404) {
        throw new Error('Product not found.');
      } else if (error.response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(`Update failed: ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error('Request Error:', error.request);
      throw new Error('Network error: No response from server');
    } else {
      console.error('Setup Error:', error.message);
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