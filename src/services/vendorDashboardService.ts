import { API_BASE_URL } from "../config";

class VendorDashboardService {
    private static instance: VendorDashboardService;
    private baseUrl = `${API_BASE_URL}/api`;

    private constructor() {}

    public static getInstance(): VendorDashboardService {
        if (!VendorDashboardService.instance) {
            VendorDashboardService.instance = new VendorDashboardService();
        }
        return VendorDashboardService.instance;
    }

    async getVendorOrders(token: string) {
        // Always use the latest vendorToken from localStorage if available
        const realToken = token || localStorage.getItem("vendorToken");
        const response = await fetch(
            `${this.baseUrl}/vendor/dashboard/orders`,
            {
                headers: {
                    Authorization: `Bearer ${realToken}`,
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
            },
        );
        if (!response.ok) throw new Error("Failed to fetch orders");
        return response.json();
    }

    async getVendorOrdersNew(
        token: string,
        params: {
            page?: number;
            limit?: number;
            status?: string;
            sort?: string;
            search?: string;
        } = {}
    ) {
        const realToken = token || localStorage.getItem("vendorToken");
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.search) queryParams.append("search", params.search);

        const url = `${this.baseUrl}/order/vendor/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${realToken}`,
                "Content-Type": "application/json",
                accept: "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to fetch orders");
        return response.json();
    }

    /** Every order matching the given filters, unpaginated — for CSV/Excel
     * export, so the exported file isn't limited to the current page. */
    async exportVendorOrders(
        token: string,
        params: { status?: string; sort?: string; search?: string } = {},
    ) {
        const realToken = token || localStorage.getItem("vendorToken");
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append("status", params.status);
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.search) queryParams.append("search", params.search);

        const url = `${this.baseUrl}/order/vendor/orders/export${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${realToken}`,
                "Content-Type": "application/json",
                accept: "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to export orders");
        return response.json();
    }
    async getVendorOrderDetail(token: string, orderId: number) {
        const realToken = token || localStorage.getItem("vendorToken");
        const response = await fetch(
            `${this.baseUrl}/order/vendor/${orderId}`,
            {
                headers: {
                    Authorization: `Bearer ${realToken}`,
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
            },
        );
        if (!response.ok) throw new Error("Failed to fetch order details");
        return response.json();
    }

    /** Read-only status timeline for a vendor's own order — vendors can
     * see why a status changed but never change it themselves. */
    async getOrderStatusHistory(
        token: string,
        orderId: number,
    ): Promise<
        Array<{
            id: number;
            previousStatus: string | null;
            newStatus: string;
            changedByRole: string;
            reason: string | null;
            note: string | null;
            createdAt: string;
        }>
    > {
        const realToken = token || localStorage.getItem("vendorToken");
        const response = await fetch(
            `${this.baseUrl}/order/vendor/${orderId}/status-history`,
            {
                headers: {
                    Authorization: `Bearer ${realToken}`,
                    accept: "application/json",
                },
            },
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load status history");
        }
        return data.data;
    }

    async getVendorStats(token: string) {
        const realToken = token || localStorage.getItem("vendorToken");
        const response = await fetch(`${this.baseUrl}/vendor/dashboard/stats`, {
            headers: {
                Authorization: `Bearer ${realToken}`,
                "Content-Type": "application/json",
                accept: "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
    }

    async getTopsellingProduct(token: string) {
        const realToken = token || localStorage.getItem("vendorToken");
        const response = await fetch(
            `${this.baseUrl}/vendor/dashboard/analytics/top-selling-products`,
            {
                headers: {
                    Authorization: `Bearer ${realToken}`,
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
            },
        );
        if (!response.ok)
            throw new Error("Failed to fetch top-selling products");
        return response.json();
    }
}

export default VendorDashboardService;
