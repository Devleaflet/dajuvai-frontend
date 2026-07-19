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
    orderedBy: {
        id: number;
        name: string;
        fullName?: string;
        username?: string;
        email: string;
        phoneNumber?: string;
        phone?: string;
    };
    shippingAddress: {
        province: string;
        district: string;
        city: string;
        localAddress?: string;
    };
    orderItems: Array<{
        id: number;
        productId: number;
        quantity: number;
        price: string;
        product: { name: string; productImages: string[] };
        vendor: {
            id: number;
            businessName: string;
            district?: { id: number; name: string };
        };
        vendorId?: number;
    }>;
    totalPrice: string;
    shippingFee: string;
    shippingBreakdown?: {
        total: number;
        vendors: Array<{
            vendorId: number;
            vendorName: string;
            vendorDistrict: string;
            itemCount: number;
            itemSubtotal: number;
            shippingFee: number;
        }>;
    };
    paymentMethod: string;
    status: string;
    createdAt: string;
}
