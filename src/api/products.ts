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
  formData: FormData,
  token?: string
) => {
  try {
    console.log('Creating product with formData:', Object.fromEntries(formData.entries()));
    
    const basePrice = formData.get('basePrice');
    if (!basePrice || parseFloat(basePrice.toString()) <= 0) {
      throw new Error('Base price must be a valid positive number');
    }

    // Prepare headers
    const headers: any = {
      'Content-Type': 'multipart/form-data',
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axiosInstance.post(
      `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`,
      formData,
      { headers }
    );
    
    console.log('Product created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating product:', error?.response?.data || error);
    
    // Handle specific error cases
    if (error?.response?.status === 403) {
      throw new Error('Not authorized to create product. Please check your permissions.');
    } else if (error?.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw error;
  }
};

export const updateProduct = async (
  productId: number,
  categoryId: number,
  subcategoryId: number,
  formData: FormData,
  token?: string
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

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
  } catch (error: any) {
    console.error('Error updating product:', error?.response?.data || error);
    
    // Handle specific error cases
    if (error?.response?.status === 403) {
      const errorMessage = error?.response?.data?.message || 'Not authorized to update this product. You can only update products you own.';
      throw new Error(errorMessage);
    } else if (error?.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error?.response?.status === 404) {
      throw new Error('Product not found or you do not have permission to access it.');
    } else if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
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
  } catch (error: any) {
    console.error('Error deleting product:', error?.response?.data || error);
    
    // Handle specific error cases
    if (error?.response?.status === 403) {
      throw new Error('Not authorized to delete this product. You can only delete products you own.');
    } else if (error?.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error?.response?.status === 404) {
      throw new Error('Product not found.');
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
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Enhanced axios interceptor setup with better error handling
export const setupAxiosInterceptors = (getTokenFn: () => string | null, logoutFn?: () => void) => {
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
    (error) => {
      console.error('Response interceptor error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          headers: error?.config?.headers
        }
      });

      // Handle authentication errors
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