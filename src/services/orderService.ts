import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getApiErrorMessage } from '../utils/apiError';

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
  variantId?: number | null;
  productNameSnapshot?: string | null;
  skuSnapshot?: string | null;
  imageSnapshot?: string | null;
  unitPriceSnapshot?: number | null;
  product: Product;
  vendor?: {
    id: number;
    businessName: string;
    district?: { id: number; name: string };
    phoneNumber?: string;
    email?: string;
  };
  variant?: {
    id: number;
    sku: string;
    basePrice: number;
    finalPrice: number;
    attributes?: Record<string, string>;
    variantImages?: string[];
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
  orderNumber?: string;
  totalPrice: number | string;
  shippingFee: number | string;
  merchandiseSubtotal?: number | string;
  discountTotal?: number | string;
  taxTotal?: number | string;
  status: string;
  deliveryStatus?: string;
  paymentStatus: string;
  paymentMethod: string;
  phoneNumber?: string;
  createdAt: string;
  shippingAddress: ShippingAddress;
  orderedBy: DetailedOrderedBy;
  orderItems: DetailedOrderItem[];
  // Immutable per-vendor shipping snapshot from the backend — always render
  // this directly, never recompute a same/cross-district guess in the UI.
  vendorShippingBreakdown?: {
    vendorId: number;
    vendorName: string;
    vendorDistrict?: string;
    customerDistrict?: string;
    shippingZone?: 'SAME_DISTRICT' | 'CROSS_DISTRICT';
    shippingFee: number;
    subtotal: number;
    itemCount: number;
    vendorTotal?: number;
  }[];
}

export interface Order {
  id: number;
  orderNumber?: string;
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

export interface OrderPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  vendorId?: number;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'oldest' | 'highest_total' | 'lowest_total' | 'recently_updated' | 'order_number';
}

interface PaginatedOrdersResponse {
  success: boolean;
  data: Order[] | { orders?: Order[]; items?: Order[]; pagination?: Partial<OrderPagination> };
  pagination?: Partial<OrderPagination>;
  message?: string;
}

const normalizeAdminOrdersResponse = (
  response: PaginatedOrdersResponse,
  requestedPage = 1,
  requestedLimit = 20,
): { orders: Order[]; pagination: OrderPagination; isPaginated: boolean } => {
  const data = response.data;
  const orders = Array.isArray(data)
    ? data
    : Array.isArray(data?.orders)
      ? data.orders
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const rawPagination = {
    ...(Array.isArray(data) ? {} : data?.pagination),
    ...response.pagination,
  };
  const isPaginated =
    rawPagination.page != null ||
    rawPagination.limit != null ||
    rawPagination.totalItems != null ||
    rawPagination.totalPages != null;

  const page = Number(rawPagination.page) || requestedPage;
  const limit = Number(rawPagination.limit) || requestedLimit;
  const totalItems = Number(rawPagination.totalItems) || orders.length;
  const totalPages =
    Number(rawPagination.totalPages) || Math.max(1, Math.ceil(totalItems / limit));

  return {
    orders,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage:
        typeof rawPagination.hasNextPage === 'boolean'
          ? rawPagination.hasNextPage
          : page < totalPages,
      hasPreviousPage:
        typeof rawPagination.hasPreviousPage === 'boolean'
          ? rawPagination.hasPreviousPage
          : page > 1,
    },
    isPaginated,
  };
};

export const OrderService = {
  getAllOrders: async (
    token: string,
    query: AdminOrdersQuery = {},
    signal?: AbortSignal,
  ): Promise<{ orders: Order[]; pagination: OrderPagination; isPaginated: boolean }> => {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      const params = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'),
      );

      const response = await axios.get<PaginatedOrdersResponse>(`${API_BASE_URL}/api/order`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        params,
        signal,
        timeout: 10000,
      });

      if (response.data.success) {
        return normalizeAdminOrdersResponse(
          response.data,
          Number(query.page) || 1,
          Number(query.limit) || 20,
        );
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        throw new Error(getApiErrorMessage(error, 'Network error'));
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
        throw new Error(getApiErrorMessage(error, 'Network error'));
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
        throw new Error(getApiErrorMessage(error, 'Network error'));
      }
      throw new Error('An unexpected error occurred');
    }
  },

  updateOrderStatus: async (
    orderId: string | number,
    newStatus: string,
    token: string,
    options: { expectedCurrentStatus?: string; reason?: string; note?: string } = {},
  ): Promise<any> => {
    if (!token) {
      throw new Error('No authentication token provided');
    }
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/order/admin/${orderId}/status`,
        { status: newStatus, ...options },
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
        throw new Error(getApiErrorMessage(error, 'Network error'));
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getOrderStatusHistory: async (orderId: string | number, token: string): Promise<Array<{
    id: number;
    previousStatus: string | null;
    newStatus: string;
    changedByRole: string;
    reason: string | null;
    note: string | null;
    createdAt: string;
    changedBy: { fullName?: string; username?: string; email?: string } | null;
  }>> => {
    if (!token) throw new Error('No authentication token provided');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/order/admin/${orderId}/status-history`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
        },
      );
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || 'Failed to load status history');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Network error'));
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
        throw new Error(getApiErrorMessage(error, 'Network error'));
      }
      throw new Error('An unexpected error occurred');
    }
  }
};
