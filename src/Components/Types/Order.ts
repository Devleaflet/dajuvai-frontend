export interface Order {
    id: number;
    orderId: string;
    orderedBy: string;
    product: string;
    createdAt: string;
    price: number;
    paymentStatus: string;
    status: string; // e.g., "Delivered", "Pending", "Canceled"
  }

export interface OrderDetail {
  id: number;
  orderedBy: { id: number; username: string; email: string };
  shippingAddress: { province: string; district: string; city: string; localAddress?: string };
  orderItems: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: string;
    product: { name: string };
    vendor: { id: number; businessName: string };
  }>;
  totalPrice: string;
  shippingFee: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}