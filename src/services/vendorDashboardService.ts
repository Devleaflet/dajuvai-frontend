import { API_BASE_URL } from '../config';

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
    const response = await fetch(`${this.baseUrl}/vendor/dashboard/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  }

  async getVendorOrdersNew(token: string) {
    const response = await fetch(`${this.baseUrl}/order/vendor/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  }

  async getVendorOrderDetail(token: string, orderId: number) {
    const response = await fetch(`${this.baseUrl}/order/vendor/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch order details");
    return response.json();
  }

  async getVendorStats(token: string) {
    const response = await fetch(`${this.baseUrl}/vendor/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  }
}

export default VendorDashboardService;
