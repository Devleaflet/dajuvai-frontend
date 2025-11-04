import { API_BASE_URL } from '../config';

class VendorDashboardService {
  private static instance: VendorDashboardService;
  private baseUrl = `${API_BASE_URL}/api`;

  private constructor() { }

  public static getInstance(): VendorDashboardService {
    if (!VendorDashboardService.instance) {
      VendorDashboardService.instance = new VendorDashboardService();
    }
    return VendorDashboardService.instance;
  }

  async getVendorOrders(token: string) {
    // Always use the latest vendorToken from localStorage if available
    const realToken = token || localStorage.getItem('vendorToken');
    const response = await fetch(`${this.baseUrl}/vendor/dashboard/orders`, {
      headers: {
        Authorization: `Bearer ${realToken}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  }

  async getVendorOrdersNew(token: string) {
    const realToken = token || localStorage.getItem('vendorToken');
    const response = await fetch(`${this.baseUrl}/order/vendor/orders`, {
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
    const realToken = token || localStorage.getItem('vendorToken');
    const response = await fetch(`${this.baseUrl}/order/vendor/${orderId}`, {
      headers: {
        Authorization: `Bearer ${realToken}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch order details");
    return response.json();
  }

  async getVendorStats(token: string) {
    const realToken = token || localStorage.getItem('vendorToken');
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
    const realToken = token || localStorage.getItem('vendorToken');
    const response = await fetch(`${this.baseUrl}/vendor/dashboard/analytics/top-selling-products`, {
      headers: {
        Authorization: `Bearer ${realToken}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  }
}

export default VendorDashboardService;
