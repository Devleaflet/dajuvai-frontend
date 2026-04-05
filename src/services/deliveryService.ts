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
        "/api/admin/delivery/riders",
        payload,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to create rider");
    return res.data.data;
};

export const getAllRiders = async (): Promise<Rider[]> => {
    const res = await axiosInstance.get<ApiResponse<Rider[]>>(
        "/api/admin/delivery/riders",
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch riders");
    return res.data.data;
};

export const getRiderById = async (riderId: number): Promise<Rider> => {
    const res = await axiosInstance.get<ApiResponse<Rider>>(
        `/api/admin/delivery/riders/${riderId}`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch rider");
    return res.data.data;
};

export const resetRiderPassword = async (
    riderId: number,
    newPassword: string,
) => {
    const res = await axiosInstance.put<ApiResponse<Rider>>(
        `/api/admin/delivery/riders/${riderId}/reset-password`,
        { newPassword },
    );

    if (!res.data.success) {
        throw new Error(res.data.message || "Failed to reset rider password");
    }

    return res.data.data;
};

// ─── Processing Orders ───────────────────────────────────────────────────────

export const getProcessingOrders = async (): Promise<Order[]> => {
    const res = await axiosInstance.get<ApiResponse<Order[]>>(
        "/api/admin/delivery/orders/processing",
    );
    if (!res.data.success)
        throw new Error(
            res.data.message || "Failed to fetch processing orders",
        );
    return res.data.data;
};

export const getProcessingOrder = async (orderId: number): Promise<Order> => {
    const res = await axiosInstance.get<ApiResponse<Order>>(
        `/api/admin/delivery/orders/${orderId}/processing`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch order");
    return res.data.data;
};

export const collectItem = async (orderItemId: number): Promise<void> => {
    const res = await axiosInstance.put<ApiMessageResponse>(
        `/api/admin/delivery/orders/orderItems/${orderItemId}/collect-items`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to collect item");
};

export const markAtWarehouse = async (orderId: number): Promise<Order> => {
    const res = await axiosInstance.patch<ApiResponse<Order>>(
        `/api/admin/delivery/orders/${orderId}/returned-warehouse`,
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
        "/api/admin/delivery/warehouse-order-queue",
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
        `/api/admin/delivery/orders/${orderId}/assign-rider`,
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
        "/api/admin/delivery/assignments",
        { params: { page, limit } },
    );
    if (!res.data.success) throw new Error("Failed to fetch assignments");
    return res.data;
};

export const getOrderAssignment = async (
    orderId: number,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.get<ApiResponse<DeliveryAssignment>>(
        `/api/admin/delivery/orders/${orderId}/assignment`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to fetch assignment");
    return res.data.data;
};

// ─── Rider Panel ─────────────────────────────────────────────────────────────

export const getRiderAssignments = async (): Promise<DeliveryAssignment[]> => {
    const res = await axiosInstance.get<ApiResponse<DeliveryAssignment[]>>(
        "/api/rider/delivery/my-assignments",
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
        `/api/rider/delivery/orders/${orderId}/pickup`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to confirm pickup");
    return res.data.data;
};

export const markDelivered = async (
    orderId: number,
): Promise<DeliveryAssignment> => {
    const res = await axiosInstance.patch<ApiResponse<DeliveryAssignment>>(
        `/api/rider/delivery/orders/${orderId}/delivered`,
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
        `/api/rider/delivery/orders/${orderId}/failed`,
        { failedReason },
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to mark as failed");
    return res.data.data;
};

export const resetFailedOrder = async (orderId: number): Promise<Order> => {
    const res = await axiosInstance.patch<ApiResponse<Order>>(
        `/api/rider/delivery/orders/${orderId}/reset`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to reset order");
    return res.data.data;
};

// ─── Failed Orders ──────────────────────────────────────────────────────────
export const getFailedOrders = async (): Promise<DeliveryAssignment[]> => {
    // filters for failed on client
    const res = await axiosInstance.get<GetAllAssignmentsResponse>(
        "/api/admin/delivery/assignments",
        { params: { page: 1, limit: 100 } },
    );
    if (!res.data.success) throw new Error("Failed to fetch assignments");
    const all = res.data.data ?? [];
    return all.filter((a) => a.assignmentStatus === "failed");
};
