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
        } = {}
    ) {
        const realToken = token || localStorage.getItem("vendorToken");
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status) queryParams.append("status", params.status);
        if (params.sort) queryParams.append("sort", params.sort);

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

    /** Updates only this vendor's own fulfillment stage
     * (OrderVendorShipping.status) — never the parent order's overall status. */
    async updateVendorOrderStatus(
        token: string,
        orderId: number,
        status: "PROCESSING" | "SHIPPED" | "CANCELLED",
        reason?: string,
    ) {
        const realToken = token || localStorage.getItem("vendorToken");
        const response = await fetch(
            `${this.baseUrl}/order/vendor/${orderId}/status`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${realToken}`,
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify({ status, reason }),
            },
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update order status");
        }
        return data;
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
