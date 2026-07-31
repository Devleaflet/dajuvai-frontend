export interface Order {
    id: number;
    orderId: string;
    orderNumber?: string;
    orderedBy: string;
    product: string;
    createdAt: string;
    price: number;
    paymentStatus: string;
    paymentMethod: string;
    status: string;
}

export interface OrderDetail {
    id: number;
    orderNumber?: string;
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
        variantId?: number | null;
        productNameSnapshot?: string | null;
        skuSnapshot?: string | null;
        imageSnapshot?: string | null;
        unitPriceSnapshot?: number | null;
        product: {
            id: number;
            name: string;
            productImages: string[];
            basePrice?: number;
            description?: string;
        } | null;
        vendor: {
            id: number;
            businessName: string;
            district?: { id: number; name: string };
            phoneNumber?: string;
            email?: string;
        };
        vendorId?: number;
        variant?: {
            id: number;
            sku: string;
            attributes: Record<string, string>;
            finalPrice: number | null;
            basePrice: number | null;
            variantImages?: string[];
        } | null;
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
            subtotal: number;
            shippingFee: number;
        }>;
    };
    appliedPromoCode?: string | null;
    paymentMethod: string;
    status: string;
    createdAt: string;
}
