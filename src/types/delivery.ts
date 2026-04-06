// Delivery System Types

// =============================================================================
// ENUMS
// =============================================================================

export enum OrderStatus {
    CONFIRMED = "CONFIRMED",
    PENDING = "PENDING",
    DELAYED = "DELAYED",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    RETURNED = "RETURNED",
}

export enum PaymentStatus {
    PAID = "PAID",
    UNPAID = "UNPAID",
}

export enum PaymentMethod {
    ONLINE_PAYMENT = "ONLINE_PAYMENT",
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
    KHALTI = "KHALTI",
    ESEWA = "ESEWA",
    NPX = "NPX",
}

export enum DeliveryStatus {
    ORDER_PROCESSING = "order_processing",
    AT_WAREHOUSE = "at_warehouse",
    READY_FOR_DELIVERY = "ready_for_delivery",
    RIDER_ASSIGNED = "rider_assigned",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    DELIVERY_FAILED = "delivery_failed",
    RETURNED_WAREHOUSE = "returned_warehouse",
}

export enum AssignmentStatus {
    ASSIGNED = "assigned",
    PICKED_UP = "picked_up",
    DELIVERED = "delivered",
    FAILED = "failed",
}

export enum OrderItemStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
}

export enum AuthProvider {
    LOCAL = "local",
    FACEBOOK = "facebook",
    GOOGLE = "google",
}

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
    STAFF = "staff",
    RIDER = "rider",
}

export enum Province {
    PROVINCE_1 = "Province 1",
    MADHESH = "Madhesh",
    BAGMATI = "Bagmati",
    GANDAKI = "Gandaki",
    LUMBINI = "Lumbini",
    KARNALI = "Karnali",
    SUDURPASHCHIM = "Sudurpashchim",
}

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

export interface User {
    id: number;
    fullName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    role: UserRole;
    provider: AuthProvider;
    isVerified: boolean;
    googleId?: string;
    facebookId?: string;
    addressId?: number;
    address?: Address;
    orders?: Order[];
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    id: number;
    province?: Province;
    district?: string;
    city: string;
    localAddress?: string;
    landmark?: string;
    userId: number;
    user?: User;
    orders?: Order[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRiderPayload {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface Rider {
    id: number;
    name?: string;
    fullName?: string;
    phoneNumber: string;
    onDelivery: boolean;
    userId?: number;
    assignments?: DeliveryAssignment[];
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: number;
    name: string;
    imageUrl?: string;
    price: number;
}

export interface Variant {
    id: string;
    name: string;
    price?: number;
}

export interface Vendor {
    id: number;
    name: string;
}

export interface OrderItem {
    id: number;
    productId: number;
    product?: Product;
    quantity: number;
    price: number | string;
    orderId: number;
    order?: Order;
    vendorId: number;
    vendor?: Vendor;
    variantId?: string;
    variant?: Variant;
    collectedAtWarehouse: boolean;
    createdAt: string;
}

export interface Order {
    id: number;
    orderedById: number;
    orderedBy?: User;
    totalPrice: number | string;
    shippingFee: number | string;
    serviceCharge: number | string;
    isBuyNow?: boolean;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    deliveryStatus: DeliveryStatus;
    shippingAddress?: Address;
    appliedPromoCode?: string;
    phoneNumber?: string;
    instrumentName?: string;
    mTransactionId?: string;
    orderItems?: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryAssignment {
    id: number;
    orderId: number;
    order?: Order;
    riderId: number;
    rider?: Rider;
    assignmentStatus: AssignmentStatus;
    pickedUpAt?: string;
    deliveredAt?: string;
    failureReason?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// PAGINATED RESPONSE WRAPPER
// =============================================================================

export interface Pagination {
    currentPage: number;
    totalPages: number;
    total: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: Pagination;
    message?: string;
}

export interface GetWarehouseOrderQueueResponse {
    success: boolean;
    data: {
        orders: Order[];
        total: number;
        pagination: Pagination;
    };
}

export interface GetAllAssignmentsResponse {
    success: boolean;
    data: DeliveryAssignment[];
    total: number;
    pagination: Pagination;
}

// Generic single-item wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Generic message-only response
export interface ApiMessageResponse {
    success: boolean;
    message: string;
}

// =============================================================================
// UI Helpers
// =============================================================================

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
    [DeliveryStatus.ORDER_PROCESSING]: "Processing",
    [DeliveryStatus.AT_WAREHOUSE]: "At Warehouse",
    [DeliveryStatus.READY_FOR_DELIVERY]: "Ready for Delivery",
    [DeliveryStatus.RIDER_ASSIGNED]: "Assigned",
    [DeliveryStatus.OUT_FOR_DELIVERY]: "Out for Delivery",
    [DeliveryStatus.DELIVERED]: "Delivered",
    [DeliveryStatus.DELIVERY_FAILED]: "Failed",
    [DeliveryStatus.RETURNED_WAREHOUSE]: "Returned to Warehouse",
    // Assignment Statuses
    [AssignmentStatus.ASSIGNED]: "Assigned",
    [AssignmentStatus.PICKED_UP]: "Picked Up",
    [AssignmentStatus.FAILED]: "Failed",
};

export const DELIVERY_STATUS_COLORS: Record<string, string> = {
    [DeliveryStatus.ORDER_PROCESSING]: "#f59e0b",
    [DeliveryStatus.AT_WAREHOUSE]: "#8b5cf6",
    [DeliveryStatus.READY_FOR_DELIVERY]: "#3b82f6",
    [DeliveryStatus.RIDER_ASSIGNED]: "#06b6d4",
    [DeliveryStatus.OUT_FOR_DELIVERY]: "#10b981",
    [DeliveryStatus.DELIVERED]: "#22c55e",
    [DeliveryStatus.DELIVERY_FAILED]: "#ef4444",
    [DeliveryStatus.RETURNED_WAREHOUSE]: "#6366f1",
    // Assignment Statuses
    [AssignmentStatus.ASSIGNED]: "#06b6d4",
    [AssignmentStatus.PICKED_UP]: "#3b82f6",
    [AssignmentStatus.FAILED]: "#ef4444",
};
