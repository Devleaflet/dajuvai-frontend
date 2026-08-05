import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../Styles/Dashboard.css";
import { Sidebar } from "./Sidebar";
import { Chart } from "chart.js/auto";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorHeader from "./VendorHeader";
import axiosInstance from "../api/axiosInstance";
import TopProducts from "./VendorDashboard/TopProducts";
import VendorRevenueByCategory from "./VendorDashboard/RevenueByCategory";
import VendorRevenueBySubCategory from "./VendorDashboard/RevenueBySubcategory";
import commissionApi, { CommissionDocument } from "../api/commission";
import { useCommissionFile } from "../Hook/useCommissionFile";
import { API_BASE_URL } from "../config";
import { Boxes, CircleDollarSign, Clock3, ShoppingCart } from "lucide-react";

interface LowStockProduct {
  productId: number;
  productName: string;
  stock: number;
  status?: string;
  variantStatus?: string;
}

interface LowStockApiRow {
  productId?: number | string;
  productid?: number | string;
  productName?: string | null;
  productname?: string | null;
  stock?: number | string | null;
  status?: string;
  variantStatus?: string;
  variantstatus?: string;
}

export function Dashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [days, setDays] = useState<number>(10); // State for days selector
  const [showAllLowStock, setShowAllLowStock] = useState<boolean>(false); // State for showing more data
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const docketHeight = useDocketHeight();
  const chartRef = useRef<Chart | null>(null);
  const { authState } = useVendorAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TanStack Query for stats
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
  } = useQuery({
    queryKey: ["vendor-stats", authState.token],
    queryFn: async () => {
      if (!authState.token) throw new Error("No authentication token available");
      const response = await axiosInstance.get("/api/vendor/dashboard/stats", {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      return response.data.data || response.data;
    },
    enabled: !!authState.token,
    staleTime: 5 * 60 * 1000,
  });

  // TanStack Query for total sales
  const {
    data: salesData,
    isLoading: salesLoading,
    isError: salesError,
    error: salesErrorObj,
  } = useQuery({
    queryKey: ["vendor-total-sales", authState.token, days],
    queryFn: async () => {
      if (!authState.token) throw new Error("No authentication token available");
      const response = await axiosInstance.get("/api/vendor/dashboard/sales-trend", {
        headers: { Authorization: `Bearer ${authState.token}` },
        params: { days },
      });
      const points = Array.isArray(response.data?.data) ? response.data.data : [];
      return {
        labels: points.map((point: { date: string }) =>
          new Date(`${point.date}T00:00:00`).toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        ),
        totals: points.map((point: { totalSales: number }) => Number(point.totalSales) || 0),
      };
    },
    enabled: !!authState.token,
    staleTime: 5 * 60 * 1000,
  });

  // TanStack Query for low stock - fetch all data at once
  const {
    data: lowStockData,
    isLoading: lowStockLoading,
    isError: lowStockError,
    error: lowStockErrorObj,
  } = useQuery({
    queryKey: ["vendor-low-stock", authState.token],
    queryFn: async () => {
      if (!authState.token) throw new Error("No authentication token available");
      // Fetch all pages of data
      let allData: LowStockProduct[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await axiosInstance.get("/api/vendor/dashboard/low-stock", {
          headers: { Authorization: `Bearer ${authState.token}` },
          params: { page: currentPage },
        });

        const responseData = response.data ?? {};
        const pageData: LowStockProduct[] = Array.isArray(responseData.data)
          ? responseData.data.map((item: LowStockApiRow) => ({
              productId: Number(item.productId ?? item.productid),
              productName: String(item.productName ?? item.productname ?? ""),
              stock: Number(item.stock) || 0,
              status: item.status,
              variantStatus: item.variantStatus ?? item.variantstatus,
            }))
          : [];
        allData = [...allData, ...pageData];
        totalPages = Number(responseData.totalPage) || currentPage;
        currentPage++;
      } while (currentPage <= totalPages);

      return { data: allData, totalData: allData.length };
    },
    enabled: !!authState.token,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch vendor profile to check payment methods
  const { data: vendorData } = useQuery({
    queryKey: ["vendor-profile-banner", authState.token],
    queryFn: async () => {
      if (!authState.token) throw new Error("No token");
      const res = await axiosInstance.get("/api/vendors/auth/vendor", {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      return res.data.vendor;
    },
    enabled: !!authState.token,
    staleTime: 5 * 60 * 1000,
  });

  const hasNoPaymentMethod = !vendorData?.paymentOptions?.length;

  // Commission document quick-download banner
  const { data: commissionDoc } = useQuery({
    queryKey: ["commission-document", authState.token],
    queryFn: async () => {
      const response = await commissionApi.getCurrentDocument(authState.token);
      return response.success ? response.data ?? null : null;
    },
    enabled: !!authState.token,
    staleTime: 5 * 60 * 1000,
  });
  const { actionLoading: commissionActionLoading, handleDownload: handleDownloadCommission } =
    useCommissionFile(commissionDoc ?? null, authState.token);

  // Keep the banner in sync without polling — admin uploads/deletes push over Socket.io.
  useEffect(() => {
    if (!authState.token) return;

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token: authState.token },
    });

    const queryKey = ["commission-document", authState.token];
    const handleCommissionUpdate = (updated: CommissionDocument) => {
      queryClient.setQueryData(queryKey, updated);
    };
    const handleCommissionDelete = () => {
      queryClient.setQueryData(queryKey, null);
    };

    socket.on("commission:update", handleCommissionUpdate);
    socket.on("commission:delete", handleCommissionDelete);

    return () => {
      socket.off("commission:update", handleCommissionUpdate);
      socket.off("commission:delete", handleCommissionDelete);
      socket.disconnect();
    };
  }, [authState.token, queryClient]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize Chart.js for Total Sales Chart
  useEffect(() => {
    const ctx = document.getElementById("sales-chart") as HTMLCanvasElement;
    if (ctx && salesData && salesData.labels.length > 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const newChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: salesData.labels,
          datasets: [
            {
              label: "Total Sales",
              data: salesData.totals,
              borderColor: "#F97316",
              backgroundColor: "rgba(249, 115, 22, 0.2)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#F97316",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (context.dataset.label === "Total Sales") {
                    return `Rs ${context.parsed.y}`;
                  } else {
                    return `${context.parsed.y}`;
                  }
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "#e5e7eb",
              },
              ticks: {
                callback: (value) => `Rs ${value}`,
              },
            },
          },
        },
      });

      chartRef.current = newChart;
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [salesData]);

  const handleDaysChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDays(parseInt(event.target.value));
  };

  const handleViewMore = () => {
    setShowAllLowStock(!showAllLowStock);
  };

  // Get displayed data based on showAllLowStock state
  const getDisplayedLowStockData = () => {
    if (!lowStockData?.data) return [];
    return showAllLowStock ? lowStockData.data : lowStockData.data.slice(0, 10);
  };

  if (statsLoading || salesLoading || lowStockLoading) {
    return (
      <div className="vendor-dash-container">
        <Sidebar />
        <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
          <VendorHeader title="Dashboard" showSearch={false} />
          <main className="dashboard__main" style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}>
            {/* Stats Section Skeleton */}
            <div className="dashboard__stats">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="stats-card">
                  <div className="stats-card__header">
                    <div className="skeleton" style={{ width: "80px", height: "14px" }}></div>
                    <div className="skeleton" style={{ width: "32px", height: "32px", borderRadius: "50%" }}></div>
                  </div>
                  <div className="stats-card__content">
                    <div className="skeleton" style={{ width: "60px", height: "24px", marginBottom: "8px" }}></div>
                    <div className="skeleton" style={{ width: "100px", height: "12px" }}></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Charts Section Skeleton */}
            <div className="dashboard__two-columns">
              <div className="dashboard__column">
                <div className="section-card revenue-analytics">
                  <div className="skeleton" style={{ width: "100%", height: "300px" }}></div>
                </div>
              </div>
              <div className="dashboard__column">
                <div className="section-card">
                  <div className="skeleton" style={{ width: "100%", height: "300px" }}></div>
                </div>
              </div>
            </div>
            {/* Full Width Sections Skeleton */}
            <div style={{ marginTop: "32px" }}>
              <div className="section-card">
                <div className="skeleton" style={{ width: "100%", height: "250px" }}></div>
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <div className="section-card">
                <div className="skeleton" style={{ width: "100%", height: "250px" }}></div>
              </div>
            </div>
            {/* Low Stock Table Skeleton */}
            <div className="dashboard__table-section">
              <div className="section-card">
                <div className="skeleton" style={{ width: "100%", height: "200px" }}></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  if (statsError || salesError || lowStockError) {
    const dashboardError = statsErrorObj?.message || salesErrorObj?.message || lowStockErrorObj?.message || "Dashboard data unavailable";
    return (
      <div className="vendor-dash-container">
        <Sidebar />
        <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
          <VendorHeader title="Dashboard" showSearch={false} />
          <main className="dashboard__main" style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}>
            <section className="section-card dashboard-error-state" role="alert">
              <h2>Dashboard unavailable</h2>
              <p>{dashboardError}</p>
              <button type="button" className="view-more-button" onClick={() => {
                void Promise.all([
                  queryClient.invalidateQueries({ queryKey: ["vendor-stats"] }),
                  queryClient.invalidateQueries({ queryKey: ["vendor-total-sales"] }),
                  queryClient.invalidateQueries({ queryKey: ["vendor-low-stock"] }),
                ]);
              }}>
                Try again
              </button>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const displayedData = getDisplayedLowStockData();

  return (
    <div className="vendor-dash-container">
      <Sidebar />
      <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
        <VendorHeader title="Dashboard" showSearch={false} />
        <main className="dashboard__main" style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}>
          {/* Payment method warning banner */}
          {!bannerDismissed && hasNoPaymentMethod && (
            <div className="payment-warning-banner">
              <span className="payment-warning-banner__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <p className="payment-warning-banner__msg">
                Want a smoother payment experience? Add a payment method anytime.
              </p>
              <button
                className="payment-warning-banner__cta"
                onClick={() => navigate("/vendor-profile")}
              >
                Add Payment Method
              </button>
              <button
                className="payment-warning-banner__close"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss banner"
              >
                ×
              </button>
            </div>
          )}

          {/* Commission document quick-download banner */}
          {commissionDoc && (
            <div className="payment-warning-banner" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
              <span className="payment-warning-banner__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="payment-warning-banner__msg">
                Commission document: <strong>{commissionDoc.title}</strong>
              </p>
              <button
                className="payment-warning-banner__cta"
                onClick={handleDownloadCommission}
                disabled={commissionActionLoading !== null}
              >
                {commissionActionLoading === "download" ? "Downloading..." : "Download"}
              </button>
              <button
                className="payment-warning-banner__cta"
                style={{ background: "transparent", color: "#F97316", border: "1px solid #F97316" }}
                onClick={() => navigate("/vendor-commission")}
              >
                View Details
              </button>
            </div>
          )}
          {/* Stats Section */}
          <div className="dashboard__stats">
            <StatsCard
              title="Total Products"
              value={statsData?.totalProducts?.toString() || "0"}
              iconType="products"
            // change={8.5}
            // trend="up"
            // timeframe="from yesterday"
            />
            <StatsCard
              title="Total Orders"
              value={statsData?.totalOrders?.toString() || "0"}
              iconType="orders"
            // change={1.3}
            // trend="up"
            // timeframe="from past week"
            />
            <StatsCard
              title="Total Sales"
              value={`Rs ${statsData?.totalSales?.toFixed(2) || "0.00"}`}
              iconType="sales"
            // change={4.3}
            // trend="down"
            // timeframe="from yesterday"
            />
            <StatsCard
              title="Total Pending"
              value={statsData?.totalPendingOrders?.toString() || "0"}
              iconType="pending"
            // change={1.8}
            // trend="up"
            // timeframe="from yesterday"
            />
          </div>
          {/* Charts Row */}
          <div className="dashboard__two-columns">
            <div className="dashboard__column">
              <div className="section-card revenue-analytics">
                <h3
                  style={{
                    marginBottom: "5px",
                    textAlign: "center"
                  }}
                >Total Sales</h3>
                <div className="revenue-analytics__legend">
                  <div className="legend-item">
                    <div className="legend-item__color legend-item__color--revenue"></div>
                    <span className="legend-item__label">Total Sales</span>
                  </div>
                </div>
                <div className="revenue-analytics__chart">
                  <canvas id="sales-chart"></canvas>
                </div>
                <select className="days-selector" value={days} onChange={handleDaysChange}>
                  <option value="7">Last 7 Days</option>
                  <option value="10">Last 10 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="60">Last 60 Days</option>
                  <option value="180">Last 6 months</option>
                </select>
              </div>
            </div>
            <div className="dashboard__column">
              <section className="section-card dashboard-chart-card">
                <VendorRevenueByCategory />
              </section>
            </div>
          </div>
          <div className="dashboard__two-columns">
            <div className="dashboard__column">
              <section className="section-card dashboard-chart-card">
                <TopProducts />
              </section>
            </div>
            <div className="dashboard__column">
              <section className="section-card dashboard-chart-card">
                <VendorRevenueBySubCategory />
              </section>

            </div>
          </div>
          {/* Low Stock Table Section */}
          <div className="dashboard__table-section">
            <div className="section-card">
              <div className="table-header-with-button">
                <h3>Low Stock Products</h3>
                {lowStockData && lowStockData.data.length > 10 && (
                  <button
                    className="view-more-button"
                    onClick={handleViewMore}
                  >
                    {showAllLowStock ? 'Show Less' : `View More (${lowStockData.data.length - 10} more)`}
                  </button>
                )}
              </div>
              {displayedData.length > 0 ? (
                <>
                  <div className="table-container">
                    <table className="low-stock-table">
                      <thead>
                        <tr>
                          <th>Product ID</th>
                          <th>Product Name</th>
                          <th>Stock</th>
                          <th>Variant Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedData.map((item) => (
                          <tr key={item.productId}>
                            <td>{item.productId}</td>
                            <td>{item.productName}</td>
                            <td>{item.stock}</td>
                            <td>{item.variantStatus || item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p>No low stock data available.</p>
              )}
            </div>
          </div>


        </main>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  iconType: string;
  change?: number;
  trend?: "up" | "down";
  timeframe?: string;
}

function StatsCard({ title, value, iconType, change, trend, timeframe }: StatsCardProps) {
	const icons = { products: Boxes, orders: ShoppingCart, sales: CircleDollarSign, pending: Clock3 };
	const Icon = icons[iconType as keyof typeof icons] ?? Boxes;
	return (
    <div className="stats-card">
      <div className="stats-card__header">
        <h3 className="stats-card__title">{title}</h3>
		<div className={`stats-card__icon stats-card__icon--${iconType}`}>
			<Icon size={19} strokeWidth={2.2} aria-hidden="true" />
		</div>
      </div>
      <div className="stats-card__content">
        <div className="stats-card__value">{value}</div>
        <div className="stats-card__trend">
          <span className={`stats-card__trend-value stats-card__trend-value--${trend}`}>
            <span className={`stats-card__trend-icon stats-card__trend-icon--${trend}`}></span>
            {change}
          </span>
          <span className="stats-card__timeframe">{timeframe}</span>
        </div>
      </div>
    </div>
  );
}
