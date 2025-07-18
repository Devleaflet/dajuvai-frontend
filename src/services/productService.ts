import axiosInstance from '../api/axiosInstance';
import { API_BASE_URL } from '../config';
import { ApiProduct, convertApiProductToDisplayProduct } from '../Components/Types/ApiProduct';
import { ProductFormData } from '../types/product';
import { AxiosError } from 'axios';

interface ProductResponse {
  success: boolean;
  data: ApiProduct;
  message?: string;
}

interface ProductsResponse {
  success: boolean;
  data: ApiProduct[];
  message?: string;
}

class ProductService {
  private static instance: ProductService;
  private baseUrl: string;
  // Use the shared axiosInstance with interceptor
  private axiosInstance = axiosInstance;

  private constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  private validateFormData(formData: ProductFormData | Partial<ProductFormData>): void {
    if ('name' in formData && !formData.name) throw new Error('Product name is required');
    if ('basePrice' in formData && (!formData.basePrice || isNaN(Number(formData.basePrice)))) throw new Error('Base price must be a valid number');
    if ('stock' in formData && (!formData.stock || isNaN(Number(formData.stock)))) throw new Error('Stock must be a valid number');
    if ('discount' in formData && formData.discount && isNaN(Number(formData.discount))) throw new Error('Discount must be a valid number');
    if ('vendorId' in formData && !formData.vendorId) throw new Error('Vendor ID is required');
    if ('inventory' in formData && formData.inventory && Array.isArray(formData.inventory)) {
      formData.inventory.forEach((inv: { sku: string; quantity: number; status: string }, index: number) => {
        if (!inv.sku) throw new Error(`Inventory[${index}]: SKU is required`);
        if (isNaN(inv.quantity) || inv.quantity < 0) throw new Error(`Inventory[${index}]: Quantity must be a non-negative number`);
        if (!inv.status) throw new Error(`Inventory[${index}]: Status is required`);
      });
    }
  }

  private async handleRequest<T>(request: Promise<T>): Promise<T> {
    try {
      const response = await request;
      return response;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const message = err.response?.data?.message || err.message || 'An error occurred';
      throw new Error(message);
    }
  }

  async getAllProducts(token: string): Promise<ApiProduct[]> {
    return this.handleRequest(
      this.axiosInstance.get<ProductsResponse>('/api/categories/all/products', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.data.data)
    );
  }

  async getFilteredProducts(
    categoryId: number,
    subcategoryId: number,
    params: { brandId?: number; dealId?: number; sort?: 'all' | 'low-to-high' | 'high-to-low' },
    token: string
  ): Promise<ApiProduct[]> {
    return this.handleRequest(
      this.axiosInstance.get<ProductsResponse>(`/api/categories/${categoryId}/subcategories/${subcategoryId}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }).then((res) => res.data.data)
    );
  }

  async getProductById(categoryId: number, subcategoryId: number, productId: number, token: string): Promise<ApiProduct> {
    return this.handleRequest(
      this.axiosInstance.get<ProductResponse>(
        `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then((res) => res.data.data)
    );
  }

  async createProduct(
    categoryId: number,
    subcategoryId: number,
    formData: ProductFormData
  ): Promise<ApiProduct> {
    this.validateFormData(formData);
    const formDataObj = new FormData();
    formDataObj.append("name", String(formData.name));
    formDataObj.append("description", String(formData.description));
    formDataObj.append("basePrice", formData.basePrice != null ? String(formData.basePrice) : "0");
    formDataObj.append("stock", formData.stock.toString());
    formDataObj.append("quantity", String(formData.quantity));
    formDataObj.append("vendorId", String(formData.vendorId));
    if (formData.discount && Number(formData.discount) > 0) {
      formDataObj.append("discount", Number(formData.discount).toFixed(2));
      formDataObj.append("discountType", String(formData.discountType || 'PERCENTAGE'));
    }
    if (Array.isArray(formData.size) && formData.size.length > 0) {
      formDataObj.append("size", formData.size.join(","));
    }
    if (formData.status) {
      formDataObj.append("status", String(formData.status));
    }
    if (formData.brand_id != null) {
      formDataObj.append("brand_id", String(formData.brand_id));
    }
    if (formData.dealId != null) {
      formDataObj.append("dealId", String(formData.dealId));
    }
    if (formData.productImages && Array.isArray(formData.productImages)) {
      formData.productImages.forEach((image, index) => {
        if (index < 5 && image instanceof File) {
          formDataObj.append("images", image);
        }
      });
    }
    if (formData.inventory && Array.isArray(formData.inventory)) {
      formDataObj.append("inventory", JSON.stringify(formData.inventory));
    }
    const endpoint = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`;
    try {
      const response = await this.axiosInstance.post<ProductResponse>(
        endpoint,
        formDataObj,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { status?: number; data?: any } };
        console.error('ProductService Error:', {
          status: err.response?.status,
          data: err.response?.data,
          url: endpoint,
        });
      }
      throw error;
    }
  }

  async updateProduct(
    categoryId: number,
    subcategoryId: number,
    productId: number,
    formData: Partial<ProductFormData>
  ): Promise<ApiProduct> {
    this.validateFormData(formData);
    const formDataObj = new FormData();
    if (formData.name) formDataObj.append("name", String(formData.name));
    if (formData.description) formDataObj.append("description", String(formData.description));
    if (formData.basePrice != null) formDataObj.append("basePrice", String(formData.basePrice));
    if (formData.stock != null) formDataObj.append("stock", formData.stock.toString());
    if (formData.quantity != null) formDataObj.append("quantity", String(formData.quantity));
    if (formData.vendorId) formDataObj.append("vendorId", String(formData.vendorId));
    if (formData.discount && Number(formData.discount) > 0) {
      formDataObj.append("discount", Number(formData.discount).toFixed(2));
      formDataObj.append("discountType", String(formData.discountType || 'PERCENTAGE'));
    }
    if (Array.isArray(formData.size) && formData.size.length > 0) {
      formDataObj.append("size", formData.size.join(","));
    }
    if (formData.status) {
      formDataObj.append("status", String(formData.status));
    }
    if (formData.brand_id != null) {
      formDataObj.append("brand_id", String(formData.brand_id));
    }
    if (formData.dealId != null) {
      formDataObj.append("dealId", String(formData.dealId));
    }
    if (formData.productImages && Array.isArray(formData.productImages)) {
      formData.productImages.forEach((image, index) => {
        if (index < 5 && image instanceof File) {
          formDataObj.append("images", image);
        }
      });
    }
    if (formData.inventory && Array.isArray(formData.inventory)) {
      formDataObj.append("inventory", JSON.stringify(formData.inventory));
    }
    const endpoint = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`;
    try {
      const response = await this.axiosInstance.put<ProductResponse>(
        endpoint,
        formDataObj,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { status?: number; data?: any } };
        console.error('ProductService Update Error:', {
          status: err.response?.status,
          data: err.response?.data,
          url: endpoint
        });
      }
      throw error;
    }
  }

  async deleteProduct(categoryId: number, subcategoryId: number, productId: number): Promise<void> {
    return this.handleRequest(
      this.axiosInstance.delete(
        `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`,
        { headers: { 'Content-Type': 'application/json' } }
      )
    );
  }

  async deleteProductImage(categoryId: number, subcategoryId: number, productId: number, imageUrl: string, token: string): Promise<ApiProduct> {
    const endpoint = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}/images`;
    try {
      const response = await this.axiosInstance.delete<ProductResponse>(
        endpoint,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: { imageUrl },
        }
      );
      return response.data.data;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { status?: number; data?: unknown } };
        console.error('ProductService Delete Image Error:', {
          status: err.response?.status,
          data: err.response?.data,
          url: endpoint,
        });
      }
      throw error;
    }
  }
}

// Export the singleton instance. Import as:
// import ProductService from '.../productService';
// Do NOT use ProductService.getInstance() in your code.
export default ProductService.getInstance();