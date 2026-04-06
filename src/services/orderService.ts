import axios from 'axios';
import { API_BASE_URL } from '../config';

interface OrderedBy {
  id: number;
  username: string;
  email: string;
  role: string;
  addressId: number | null;

  provider: string;
  isVerified: boolean;
  password: string;
  verificationCode: string | null;
  verificationCodeExpire: string | null;
  resetToken: string | null;
  resetTokenExpire: string | null;
  resendCount: number;
  resendBlockUntil: string | null;
  createdAt: string;
  updatedAt: string;
  address: any | null;
}

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  orderId: number;
  vendorId: number;
  createdAt: string;
}

interface ShippingAddress {
  city: string;
  district: string;
  streetAddress?: string;
  localAddress?: string;
  province: string;
  landmark?: string;
}

interface Product {
  id?: number;
  name: string;
  basePrice: number;
  productImages?: string[];
}

interface DetailedOrderItem {
  id?: number;
  productId: number;
  quantity: number;
  price: number;
  vendorId: number;
  product: Product;
  vendor?: {
    id: number;
    businessName: string;
    district?: { id: number; name: string };
  };
  variant?: {
    id: string;
    sku: string;
    basePrice: number;
    finalPrice: number;
    discount: number;
    discountType: string;
    attributes?: Record<string, string>;
    variantImages?: string[];
    stock?: number;
    status?: string;
  } | null;
}

interface DetailedOrderedBy {
  id: number;
  username?: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
}

export interface DetailedOrder {
  id: number;
  totalPrice: number | string;
  shippingFee: number | string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  orderedBy: DetailedOrderedBy;
  orderItems: DetailedOrderItem[];
}

export interface Order {
  id: number;
  orderedById: number;
  totalPrice: string;
  shippingFee: string;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  shippingAddressId: number;
  transactionId: string | null;
  gatewayResponse: any | null;
  createdAt: string;
  updatedAt: string;
  orderedBy: OrderedBy;
  orderItems: OrderItem[];
  shippingAddress?: ShippingAddress | null;
}

interface ApiResponse {
  success: boolean;
  data: Order[];
  message?: string;
}

interface DetailedOrderResponse {
  success: boolean;
  data: DetailedOrder;
  message?: string;
}

export const OrderService = {
  getAllOrders: async (token: string): Promise<Order[]> => {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/order`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.data.success) {
        //(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        throw new Error(error.response?.data.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getOrderById: async (orderId: string, token: string): Promise<DetailedOrder> => {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      const response = await axios.get<DetailedOrderResponse>(`${API_BASE_URL}/api/order/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch order details');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        if (error.response?.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(error.response?.data.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getCustomerOrderHistory: async (token: string): Promise<any[]> => {
    if (!token) {
      throw new Error('No authentication token provided');
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/order/customer/history`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch order history');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        throw new Error(error.response?.data.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  updateOrderStatus: async (orderId: string | number, newStatus: string, token: string): Promise<any> => {
    if (!token) {
      throw new Error('No authentication token provided');
    }
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/order/admin/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        throw new Error(error.response?.data.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  trackOrder: async (orderId: number, email: string): Promise<{ success: boolean; orderStatus: string }> => {
    //('Attempting GET request to track order:', orderId, email);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/order/user/track`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            orderId,  
            email,    
          },
          timeout: 10000,
        }
      );
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to track order');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Order does not exist or does not belong to the user');
        }
        if (error.response?.status === 400) {
          throw new Error('Order ID or email is required/invalid');
        }
        throw new Error(error.response?.data.message || 'Network error');
      }
      throw new Error('An unexpected error occurred');
    }
  }
};
