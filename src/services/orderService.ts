// import axios from 'axios';
// import { API_BASE_URL } from '../config';

// // Remove or comment out unused import
// // import { ShippingAddress } from ...

// interface OrderedBy {
//   id: number;
//   username: string;
//   email: string;
//   role: string;
//   addressId: number | null;

//   provider: string;
//   isVerified: boolean;
//   password: string;
//   verificationCode: string | null;
//   verificationCodeExpire: string | null;
//   resetToken: string | null;
//   resetTokenExpire: string | null;
//   resendCount: number;
//   resendBlockUntil: string | null;
//   createdAt: string;
//   updatedAt: string;
//   address: any | null;
// }

// interface OrderItem {
//   id: number;
//   productId: number;
//   quantity: number;
//   price: string;
//   orderId: number;
//   vendorId: number;
//   createdAt: string;
// }

// interface ShippingAddress {
//   city: string;
//   district: string;
//   streetAddress: string;
//   province: string;
// }

// interface Product {
//   name: string;
//   basePrice: number;
// }

// interface DetailedOrderItem {
//   productId: number;
//   quantity: number;
//   price: number;
//   vendorId: number;
//   product: Product;
// }

// interface DetailedOrderedBy {
//   id: number;
//   username: string;
//   email: string;
// }

// export interface DetailedOrder {
//   id: number;
//   totalPrice: number | string;
//   shippingFee: number | string;
//   status: string;
//   paymentStatus: string;
//   paymentMethod: string;
//   shippingAddress: ShippingAddress;
//   orderedBy: DetailedOrderedBy;
//   orderItems: DetailedOrderItem[];
// }

// export interface Order {
//   id: number;
//   orderedById: number;
//   totalPrice: string;
//   shippingFee: string;
//   paymentStatus: string;
//   paymentMethod: string;
//   status: string;
//   shippingAddressId: number;
//   transactionId: string | null;
//   gatewayResponse: any | null;
//   createdAt: string;
//   updatedAt: string;
//   orderedBy: OrderedBy;
//   orderItems: OrderItem[];
//   shippingAddress?: ShippingAddress | null;
// }

// interface ApiResponse {
//   success: boolean;
//   data: Order[];
//   message?: string;
// }

// interface DetailedOrderResponse {
//   success: boolean;
//   data: DetailedOrder;
//   message?: string;
// }

// export const OrderService = {
//   getAllOrders: async (token: string): Promise<Order[]> => {
//     if (!token) {
//       throw new Error('No authentication token provided');
//     }

//     try {
//       const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/order`, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         timeout: 10000,
//       });

//       if (response.data.success) {
//         return response.data.data;
//       } else {
//         throw new Error(response.data.message || 'Failed to fetch orders');
//       }
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           throw new Error('Unauthorized: Invalid or expired token');
//         }
//         throw new Error(error.response?.data.message || 'Network error');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getOrderById: async (orderId: string, token: string): Promise<DetailedOrder> => {
//     if (!token) {
//       throw new Error('No authentication token provided');
//     }

//     try {
//       const response = await axios.get<DetailedOrderResponse>(`${API_BASE_URL}/api/order/${orderId}`, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         timeout: 10000,
//       });

//       if (response.data.success) {
//         return response.data.data;
//       } else {
//         throw new Error(response.data.message || 'Failed to fetch order details');
//       }
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           throw new Error('Unauthorized: Invalid or expired token');
//         }
//         if (error.response?.status === 404) {
//           throw new Error('Order not found');
//         }
//         throw new Error(error.response?.data.message || 'Network error');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getCustomerOrderHistory: async (token: string): Promise<any[]> => {
//     if (!token) {
//       throw new Error('No authentication token provided');
//     }
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/order/customer/history`, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         timeout: 10000,
//       });
//       if (response.data.success) {
//         return response.data.data;
//       } else {
//         throw new Error(response.data.message || 'Failed to fetch order history');
//       }
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           throw new Error('Unauthorized: Invalid or expired token');
//         }
//         throw new Error(error.response?.data.message || 'Network error');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   updateOrderStatus: async (orderId: string | number, newStatus: string, token: string): Promise<any> => {
//     if (!token) {
//       throw new Error('No authentication token provided');
//     }
//     try {
//       const response = await axios.put(
//         `${API_BASE_URL}/api/order/admin/${orderId}/status`,
//         { status: newStatus },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,
//           },
//           timeout: 10000,
//         }
//       );
//       if (response.data.success) {
//         return response.data.data;
//       } else {
//         throw new Error(response.data.message || 'Failed to update order status');
//       }
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           throw new Error('Unauthorized: Invalid or expired token');
//         }
//         throw new Error(error.response?.data.message || 'Network error');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },
// };




import axios from 'axios';
import { API_BASE_URL } from '../config';

// Remove or comment out unused import
// import { ShippingAddress } from ...

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
  streetAddress: string;
  province: string;
}

interface Product {
  name: string;
  basePrice: number;
}

interface DetailedOrderItem {
  productId: number;
  quantity: number;
  price: number;
  vendorId: number;
  product: Product;
}

interface DetailedOrderedBy {
  id: number;
  username: string;
  email: string;
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
        console.log(response.data.data);
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
};