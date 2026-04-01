import axiosInstance from "../api/axiosInstance";
import type {
    Rider,
    Order,
    DeliveryAssignment,
    GetAllAssignmentsResponse,
    GetWarehouseOrderQueueResponse,
    ApiResponse,
    ApiMessageResponse,
    CreateRiderPayload,
} from "../types/delivery";

// ─── Riders ─────────────────────────────────────────────────────────────────

export const createRider = async (
    payload: CreateRiderPayload,
): Promise<Rider> => {
    const res = await axiosInstance.post<ApiResponse<Rider>>(
        "/api/delivery/riders",
        payload,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to create rider");
    return res.data.data;
};

export const getAllRiders = async (): Promise<Rider[]> => {
    const res = await axiosInstance.get<ApiResponse<Rider[]>>(
        "/api/delivery/riders",
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch riders");
    return res.data.data;
};

export const getRiderById = async (riderId: number): Promise<Rider> => {
    const res = await axiosInstance.get<ApiResponse<Rider>>(
        `/api/delivery/riders/${riderId}`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch rider");
    return res.data.data;
};

// ─── Processing Orders ───────────────────────────────────────────────────────

export const getProcessingOrders = async (): Promise<Order[]> => {
    const res = await axiosInstance.get<ApiResponse<Order[]>>(
        "/api/delivery/orders/processing",
    );
    if (!res.data.success)
        throw new Error(
            res.data.message || "Failed to fetch processing orders",
        );
    return res.data.data;
};

export const getProcessingOrder = async (orderId: number): Promise<Order> => {
    const res = await axiosInstance.get<ApiResponse<Order>>(
        `/api/delivery/orders/${orderId}/processing`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch order");
    return res.data.data;
};

export const collectItem = async (orderItemId: number): Promise<void> => {
    const res = await axiosInstance.put<ApiMessageResponse>(
        `/api/delivery/orders/orderItems/${orderItemId}/collect-items`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to collect item");
};

export const markAtWarehouse = async (orderId: number): Promise<Order> => {
    const res = await axiosInstance.patch<ApiResponse<Order>>(
        `/api/delivery/orders/${orderId}/returned-warehouse`,
    );
    if (!res.data.success)
        throw new Error(
            res.data.message || "Failed to mark order at warehouse",
        );
    return res.data.data;
};

// ─── Warehouse Queue ─────────────────────────────────────────────────────────

export const getWarehouseQueue = async (
    page = 1,
    limit = 10,
): Promise<GetWarehouseOrderQueueResponse> => {
    const res = await axiosInstance.get<GetWarehouseOrderQueueResponse>(
        "/api/delivery/warehouse-order-queue",
        { params: { page, limit } },
    );
    if (!res.data.success) throw new Error("Failed to fetch warehouse queue");
    return res.data;
};

export const assignRider = async (
    orderId: number,
    riderId: number,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.post<ApiResponse<DeliveryAssignment>>(
        `/api/delivery/orders/${orderId}/assign-rider`,
        { riderId },
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to assign rider");
    return res.data.data;
};

// ─── Assignments ─────────────────────────────────────────────────────────────

export const getAllAssignments = async (
    page = 1,
    limit = 10,
): Promise<GetAllAssignmentsResponse> => {
    const res = await axiosInstance.get<GetAllAssignmentsResponse>(
        "/api/delivery/assignments",
        { params: { page, limit } },
    );
    if (!res.data.success) throw new Error("Failed to fetch assignments");
    return res.data;
};

export const getOrderAssignment = async (
    orderId: number,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.get<ApiResponse<DeliveryAssignment>>(
        `/api/delivery/orders/${orderId}/assignment`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch assignment");
    return res.data.data;
};

// ─── Rider Panel ─────────────────────────────────────────────────────────────

export const getRiderAssignments = async (): Promise<DeliveryAssignment[]> => {
    const res = await axiosInstance.get<ApiResponse<DeliveryAssignment[]>>(
        "/api/delivery/my-assignments",
    );
    if (!res.data.success)
        throw new Error(
            res.data.message || "Failed to fetch rider assignments",
        );
    return res.data.data;
};

export const confirmPickup = async (
    orderId: number,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.patch<ApiResponse<DeliveryAssignment>>(
        `/api/delivery/orders/${orderId}/pickup`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to confirm pickup");
    return res.data.data;
};

export const markDelivered = async (
    orderId: number,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.patch<ApiResponse<DeliveryAssignment>>(
        `/api/delivery/orders/${orderId}/delivered`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to mark as delivered");
    return res.data.data;
};

export const markFailed = async (
    orderId: number,
    failedReason: string,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.patch<ApiResponse<DeliveryAssignment>>(
        `/api/delivery/orders/${orderId}/failed`,
        { failedReason },
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to mark as failed");
    return res.data.data;
};

export const resetFailedOrder = async (orderId: number): Promise<Order> => {
    const res = await axiosInstance.patch<ApiResponse<Order>>(
        `/api/delivery/orders/${orderId}/reset`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to reset order");
    return res.data.data;
};

// ─── Failed Orders ──────────────────────────────────────────────────────────
export const getFailedOrders = async (): Promise<DeliveryAssignment[]> => {
    // Uses normal /delivery/assignments and filters for failed on client
    const res = await axiosInstance.get<GetAllAssignmentsResponse>(
        "/api/delivery/assignments",
        { params: { page: 1, limit: 100 } },
    );
    if (!res.data.success) throw new Error("Failed to fetch assignments");
    const all = res.data.assignments ?? [];
    return all.filter((a) => a.assignmentStatus === "failed");
};
