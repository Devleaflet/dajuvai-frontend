import axiosInstance from "./axiosInstance";

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

export const createProduct = async (
  categoryId: number,
  subcategoryId: number,
  formData: FormData
) => {
  try {
    console.log('=== PRODUCT CREATION START ===');
    console.log('Category ID:', categoryId);
    console.log('Subcategory ID:', subcategoryId);
    console.log('FormData entries:', Object.fromEntries(formData.entries()));
    
    // Log all form data entries for debugging
    for (const [key, value] of formData.entries()) {
      console.log(`FormData ${key}:`, value);
    }

    // Validate required fields based on hasVariants
    const hasVariants = formData.get('hasVariants');
    const name = formData.get('name');
    const variants = formData.get('variants');
    
    console.log('Has Variants:', hasVariants);
    console.log('Product Name:', name);
    console.log('Variants Data:', variants);

    // Validation for required fields
    if (!name) {
      console.error('Validation Error: Product name is required');
      throw new Error('Product name is required');
    }

    if (!hasVariants) {
      console.log('Non-variant product validation');
      const basePrice = formData.get('basePrice');
      const stock = formData.get('stock');
      const status = formData.get('status');
      
      console.log('Base Price:', basePrice);
      console.log('Stock:', stock);
      console.log('Status:', status);

      if (!basePrice || parseFloat(basePrice.toString()) <= 0) {
        console.error('Validation Error: Base price must be a valid positive number for non-variant products');
        throw new Error('Base price must be a valid positive number for non-variant products');
      }

      if (!stock || parseInt(stock.toString()) < 0) {
        console.error('Validation Error: Stock must be a valid non-negative number for non-variant products');
        throw new Error('Stock must be a valid non-negative number for non-variant products');
      }

      if (!status) {
        console.error('Validation Error: Status is required for non-variant products');
        throw new Error('Status is required for non-variant products');
      }
    } else {
      console.log('Variant product validation');
      if (!variants) {
        console.error('Validation Error: Variants data is required for variant products');
        throw new Error('Variants data is required for variant products');
      }

      try {
        const variantsData = JSON.parse(variants.toString());
        console.log('Parsed variants data:', variantsData);
        
        if (!Array.isArray(variantsData) || variantsData.length === 0) {
          console.error('Validation Error: Variants must be a non-empty array');
          throw new Error('Variants must be a non-empty array');
        }

        // Validate each variant
        variantsData.forEach((variant: any, index: number) => {
          console.log(`Validating variant ${index}:`, variant);
          
          if (!variant.sku) {
            console.error(`Validation Error: Variant ${index} missing SKU`);
            throw new Error(`Variant ${index} missing SKU`);
          }
          
          if (!variant.price || variant.price <= 0) {
            console.error(`Validation Error: Variant ${index} must have a valid positive price`);
            throw new Error(`Variant ${index} must have a valid positive price`);
          }
          
          if (!variant.stock || variant.stock < 0) {
            console.error(`Validation Error: Variant ${index} must have a valid non-negative stock`);
            throw new Error(`Variant ${index} must have a valid non-negative stock`);
          }
          
          if (!variant.status || !['AVAILABLE', 'OUT_OF_STOCK', 'LOW_STOCK'].includes(variant.status)) {
            console.error(`Validation Error: Variant ${index} must have a valid status`);
            throw new Error(`Variant ${index} must have a valid status`);
          }
          
          // Check if variant images are provided in FormData
          const variantImageKey = `variantImages${index + 1}`;
          const hasVariantImages = Array.from(formData.entries()).some(([key]) => key === variantImageKey);
          
          if (!hasVariantImages) {
            console.error(`Validation Error: No images provided for variant ${variant.sku}`);
            throw new Error(`No images provided for variant ${variant.sku}`);
          }
        });
      } catch (parseError) {
        console.error('Validation Error: Invalid JSON format for variants data:', parseError);
        throw new Error('Invalid JSON format for variants data');
      }
    }

    // Prepare headers
    const headers: any = {
      'Content-Type': 'multipart/form-data',
    };

    console.log('Making API request to:', `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`);
    console.log('Request headers:', headers);

    // Make the API call
    const response = await axiosInstance.post(
      `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`,
      formData,
      { headers }
    );
    
    console.log('=== PRODUCT CREATION SUCCESS ===');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('=== PRODUCT CREATION END ===');
    
    return response.data;
  } catch (error: unknown) {
    console.error('=== PRODUCT CREATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error object:', error);
    
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { status?: number; data?: any } };
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      
      if (err.response?.status === 403) {
        console.error('Authorization Error: Not authorized to create product');
        throw new Error('Not authorized to create product. Please check your permissions.');
      } else if (err.response?.status === 401) {
        console.error('Authentication Error: Authentication failed');
        throw new Error('Authentication failed. Please login again.');
      } else if (err.response?.status === 400) {
        console.error('Bad Request Error:', err.response?.data?.message);
        throw new Error(err.response?.data?.message || 'Bad request - please check your input data');
      } else if (err.response?.status === 404) {
        console.error('Not Found Error:', err.response?.data?.message);
        throw new Error(err.response?.data?.message || 'Category or subcategory not found');
      } else if (err.response?.data?.message) {
        console.error('API Error:', err.response.data.message);
        throw new Error(err.response.data.message);
      }
    }
    
    console.error('Unexpected error:', error);
    throw error;
  }
};

export const updateProduct = async (
  productId: number,
  categoryId: number,
  subcategoryId: number,
  formData: FormData
) => {
  try {
    console.log(`Updating product ${productId} with formData:`, Object.fromEntries(formData.entries()));
    
    const basePrice = formData.get('basePrice');
    if (!basePrice || parseFloat(basePrice.toString()) <= 0) {
      throw new Error('Base price must be a valid positive number');
    }

    // Debug formData contents
    for (const [key, value] of formData.entries()) {
      console.log(`formData ${key}: ${value}`);
    }

    // Ensure vendorId is included and matches the authenticated vendor
    const vendorId = formData.get('vendorId');
    if (!vendorId) {
      throw new Error('Vendor ID is required for product update');
    }

    // Prepare headers
    const headers: any = {
      'Content-Type': 'multipart/form-data',
    };

    // Do not set Authorization header manually
    console.log('Update request headers:', headers);
    console.log('Update URL:', `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`);

    // Fetch product details before editing
    const product = await fetchProduct(`/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`);
    console.log(product.vendorId); // Should be 7 for your vendor

    const response = await axiosInstance.put(
      `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`,
      formData,
      { headers }
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