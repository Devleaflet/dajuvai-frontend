// Delivery System Types

// =============================================================================
// ENUMS
// =============================================================================

export enum OrderStatus {
    ORDER_PLACED = "ORDER_PLACED",
    CONFIRMED = "CONFIRMED",
    PROCESSING = "PROCESSING",
    ARRIVED_AT_WAREHOUSE = "ARRIVED_AT_WAREHOUSE",
    DELAYED = "DELAYED",
    ASSIGNED_TO_RIDER = "ASSIGNED_TO_RIDER",
    DELIVERED = "DELIVERED",
    NOT_RECEIVED = "NOT_RECEIVED",
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

export enum AssignmentStatus {
    ASSIGNED = "assigned",
    PICKED_UP = "picked_up",
    DELIVERED = "delivered",
    FAILED = "failed",
    NONE = "none",
    REASSIGNED = "reassigned"
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
    PROVINCE_1 = "Koshi",
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
    documentUrl: string;
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
    businessName: string;
    phoneNumber?: string;
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
    createdAt: string;
}

export interface Order {
    id: number;
    orderNumber?: string;
    orderedById: number;
    orderedBy?: User;
    totalPrice: number | string;
    shippingFee: number | string;
    serviceCharge: number | string;
    isBuyNow?: boolean;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    shippingAddress?: Address;
    appliedPromoCode?: string;
    phoneNumber?: string;
    instrumentName?: string;
    mTransactionId?: string;
    orderItems?: OrderItem[];
    assignedRider?: Rider | null;
    assignmentStatus?: AssignmentStatus | null;
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

export interface BulkAssignResult {
    orderId: number;
    success: boolean;
    error?: string;
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

export const ORDER_STATUS_LABELS: Record<string, string> = {
    [OrderStatus.ORDER_PLACED]: "Order Placed",
    [OrderStatus.CONFIRMED]: "Confirmed",
    [OrderStatus.PROCESSING]: "Processing",
    [OrderStatus.ARRIVED_AT_WAREHOUSE]: "At Warehouse",
    [OrderStatus.DELAYED]: "Delayed",
    [OrderStatus.ASSIGNED_TO_RIDER]: "Rider Assigned",
    [OrderStatus.DELIVERED]: "Delivered",
    [OrderStatus.NOT_RECEIVED]: "Not Received",
    [OrderStatus.CANCELLED]: "Cancelled",
    [OrderStatus.RETURNED]: "Returned",
    // Assignment Statuses
    [AssignmentStatus.ASSIGNED]: "Assigned",
    [AssignmentStatus.PICKED_UP]: "Picked Up",
    [AssignmentStatus.DELIVERED]: "Delivered",
    [AssignmentStatus.FAILED]: "Failed",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
    [OrderStatus.ORDER_PLACED]: "#6b7280",
    [OrderStatus.CONFIRMED]: "#3b82f6",
    [OrderStatus.PROCESSING]: "#f59e0b",
    [OrderStatus.ARRIVED_AT_WAREHOUSE]: "#8b5cf6",
    [OrderStatus.DELAYED]: "#d97706",
    [OrderStatus.ASSIGNED_TO_RIDER]: "#06b6d4",
    [OrderStatus.DELIVERED]: "#22c55e",
    [OrderStatus.NOT_RECEIVED]: "#ef4444",
    [OrderStatus.CANCELLED]: "#ef4444",
    [OrderStatus.RETURNED]: "#6366f1",
    // Assignment Statuses
    [AssignmentStatus.ASSIGNED]: "#06b6d4",
    [AssignmentStatus.PICKED_UP]: "#3b82f6",
    [AssignmentStatus.FAILED]: "#ef4444",
};
