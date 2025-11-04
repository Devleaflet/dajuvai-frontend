import { useState, useRef, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import "../Styles/Dashboard.css";
import { Sidebar } from "./Sidebar";
import { Chart } from "chart.js/auto";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorHeader from "./VendorHeader";
import axiosInstance from "../api/axiosInstance";
import TopProducts from "./VendorDashboard/TopProducts";

interface DashboardProps {
  version?: string;
}

interface TotalSalesData {
  vendorId: number;
  totalSales: number;
}

interface LowStockData {
  success: boolean;
  currentPage: string;
  totalPage: number;
  totalData: number;
  data: Array<{
    status: string;
    productid: number;
    productname: string;
    vendorid: number;
    vendorname: string;
    stock: number;
    variantStatus: string;
  }>;
}

export function Dashboard({ version = "123456" }: DashboardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [days, setDays] = useState<number>(10); // State for days selector
  const [showAllLowStock, setShowAllLowStock] = useState<boolean>(false); // State for showing more data
  const docketHeight = useDocketHeight();
  const chartRef = useRef<Chart | null>(null);
  const { authState } = useVendorAuth();

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
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      const salesPromises = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toISOString().split('T')[0];
        salesPromises.push(
          axiosInstance.get("/api/vendor/dashboard/total-sales", {
            headers: { Authorization: `Bearer ${authState.token}` },
            params: { startDate: formattedDate, endDate: formattedDate },
          })
        );
      }
      const salesResults = await Promise.all(salesPromises);
      console.log("salesress", salesResults);
      const labels: string[] = [];
      const totals: number[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const formattedDate = d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        labels.push(formattedDate);
        const result = salesResults.shift();
        totals.push(result?.data?.totalSales || 0);
      }

      return { labels, totals };
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
      let allData: any[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await axiosInstance.get("/api/vendor/dashboard/low-stock", {
          headers: { Authorization: `Bearer ${authState.token}` },
          params: { page: currentPage },
        });

        const responseData = response.data;
        allData = [...allData, ...responseData.data];
        totalPages = responseData.totalPage;
        currentPage++;
      } while (currentPage <= totalPages);

      console.log("dataaaaa", { ...lowStockData, data: allData });
      return { ...lowStockData, data: allData, totalData: allData.length };
    },
    enabled: !!authState.token,
    staleTime: 5 * 60 * 1000,
  });

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
    console.log("saless", salesData)
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
              borderColor: "#3B82F6",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#3B82F6",
              tension: 0.4,
            },
            {
              label: "Sales Trend",
              data: salesData.totals.map(total => total * 0.5),
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              tension: 0.4,
              borderColor: "rgba(59, 130, 246, 0.5)",
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
            {/* Chart Section Skeleton */}
            <div className="dashboard__two-columns">
              <div className="dashboard__column">
                <div className="section-card revenue-analytics">
                  <div className="skeleton" style={{ width: "100%", height: "300px" }}></div>
                </div>
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
    return <div>Error: {statsErrorObj?.message || salesErrorObj?.message || lowStockErrorObj?.message}</div>;
  }

  const displayedData = getDisplayedLowStockData();

  return (
    <div className="vendor-dash-container">
      <Sidebar />
      <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
        <VendorHeader title="Dashboard" showSearch={false} />
        <main className="dashboard__main" style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}>
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
          {/* Total Sales Chart Section */}
          <div className="dashboard__two-columns">
            <div className="dashboard__column">
              <div className="section-card revenue-analytics">
                <div className="revenue-analytics__legend">
                  <div className="legend-item">
                    <div className="legend-item__color legend-item__color--revenue"></div>
                    <span className="legend-item__label">Total Sales</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-item__color legend-item__color--order"></div>
                    <span className="legend-item__label">Sales Trend</span>
                  </div>
                </div>
                <div className="revenue-analytics__chart">
                  <canvas id="sales-chart"></canvas>
                </div>
                <select className="days-selector" value={days} onChange={handleDaysChange}>
                  <option value="7">Last 7 Days</option>
                  <option value="10">Last 10 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>
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
                        {console.log("low", lowStockData)}
                        {displayedData.map((item) => (
                          <tr key={item.productid}>
                            <td>{item.productid}</td>
                            <td>{item.productname}</td>
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

          <TopProducts />
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
  return (
    <div className="stats-card">
      <div className="stats-card__header">
        <h3 className="stats-card__title">{title}</h3>
        <div className={`stats-card__icon stats-card__icon--${iconType}`}></div>
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