import axiosInstance from "../api/axiosInstance";
import {
    type Rider,
    type Order,
    type DeliveryAssignment,
    type ApiResponse,
    type ApiMessageResponse,
    type CreateRiderPayload,
    type PaginatedResponse,
    type BulkAssignResult,
    OrderStatus,
} from "../types/delivery";

// ─── Riders ────────────────────────────────────────────────────────────────

export const uploadDocument = async (doc: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", doc);

    const res = await axiosInstance.post<ApiResponse<string>>(
        `/api/image?folder=rider_documents`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );

    return res.data.data;
};

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
): Promise<string> => {
    const res = await axiosInstance.put<ApiMessageResponse>(
        `/api/admin/delivery/riders/${riderId}/reset-password`,
        { newPassword },
    );

    if (!res.data.success) {
        throw new Error(res.data.message || "Failed to reset rider password");
    }

    return res.data.message;
};

// ─── All Orders (AT_WAREHOUSE) ─────────────────────────────────────────────

export const getAtWarehouseOrders = async (
    page = 1,
    limit = 20,
    search?: string,
    sort: "newest" | "oldest" = "newest",
    statuses?: string[],
): Promise<PaginatedResponse<Order>> => {
    const res = await axiosInstance.get<PaginatedResponse<Order>>(
        "/api/admin/delivery/orders/at-warehouse",
        {
            params: {
                page,
                limit,
                search,
                sort,
                statuses: statuses && statuses.length > 0 ? statuses.join(",") : undefined,
            },
        },
    );
    if (!res.data.success) throw new Error("Failed to fetch warehouse orders");
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

export const bulkAssignRiders = async (
    orderIds: number[],
    riderId: number,
): Promise<BulkAssignResult[]> => {
    const res = await axiosInstance.post<ApiResponse<BulkAssignResult[]>>(
        "/api/admin/delivery/orders/bulk-assign",
        { orderIds, riderId },
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to bulk assign riders");
    return res.data.data;
};

// ─── Assignments ─────────────────────────────────────────────────────────────

export const getAllAssignments = async (
    page = 1,
    limit = 10,
): Promise<PaginatedResponse<DeliveryAssignment>> => {
    const res = await axiosInstance.get<PaginatedResponse<DeliveryAssignment>>(
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
        `/api/admin/delivery/orders/${orderId}/reset-to-warehouse`,
    );
    if (!res.data.success)
        throw new Error(res.data.message || "Failed to reset order");
    return res.data.data;
};

// ─── Failed Orders ──────────────────────────────────────────────────────────

export const getFailedOrders = async (): Promise<DeliveryAssignment[]> => {
    const res = await axiosInstance.get<PaginatedResponse<DeliveryAssignment>>(
        "/api/admin/delivery/assignments",
        { params: { page: 1, limit: 100 } },
    );
    if (!res.data.success) throw new Error("Failed to fetch assignments");
    const all = res.data.data ?? [];
    return all.filter((a) => a.assignmentStatus === "failed");
};

export const getFailedDeliveries = async (): Promise<DeliveryAssignment[]> => {
  const res = await axiosInstance.get<
    ApiResponse<DeliveryAssignment[]>
  >("/api/admin/delivery/orders/failed-deliveries");

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to fetch failed deliveries");
  }

  return res.data.data;
};
