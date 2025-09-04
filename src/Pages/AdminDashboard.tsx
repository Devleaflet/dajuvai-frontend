import { useState, useEffect, useRef } from "react";
import "../Styles/AdminDashboard.css";
import { Chart } from "chart.js/auto";
import Header from "../Components/Header";
import { AdminSidebar } from "../Components/AdminSidebar";
import { useDocketHeight } from "./../Hook/UseDockerHeight";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import Skeleton from "../Components/Skeleton/Skeleton";

const STATS_CACHE_KEY = "admin_dashboard_stats";
const REVENUE_CACHE_KEY = "admin_dashboard_revenue";
const CACHE_TTL = 5 * 60 * 1000; 

interface StatData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalVendors: number;
  totalProducts: number;
  totalDeliveredRevenue: number;
}

interface RevenueData {
  date: string;
  revenue: string;
}



interface StatsCardProps {
  title: string;
  value: string | number;
  iconType: string;
  change: number;
  trend: "up" | "down";
  timeframe: string;
}

function StatsCard({ title, value, iconType }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {iconType === "sales" && "💰"}
        {iconType === "orders" && "📦"}
        {iconType === "customers" && "👥"}
        {iconType === "vendors" && "🏪"}
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { token } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState<StatData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [days, setDays] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const docketHeight = useDocketHeight();

  const revenueChartRef = useRef<Chart | null>(null);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      // Check cache for stats
      const cachedStats = localStorage.getItem(STATS_CACHE_KEY);
      if (cachedStats) {
        try {
          const { data, timestamp } = JSON.parse(cachedStats);
          if (data && Date.now() - timestamp < CACHE_TTL) {
            setStats(data);
            return;
          }
        } catch {}
      }

      try {
        const response = await axiosInstance.get("/api/admin/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.success) {
          setStats(response.data.data);
          localStorage.setItem(
            STATS_CACHE_KEY,
            JSON.stringify({ data: response.data.data, timestamp: Date.now() })
          );
        } else {
          setError(response.data.message || "Failed to fetch dashboard stats");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching dashboard stats");
      }
    };

    const fetchRevenue = async () => {
      // Check cache for revenue
      const cachedRevenue = localStorage.getItem(`${REVENUE_CACHE_KEY}_${days}`);
      if (cachedRevenue) {
        try {
          const { data, timestamp } = JSON.parse(cachedRevenue);
          if (data && Date.now() - timestamp < CACHE_TTL) {
            setRevenue(data);
            return;
          }
        } catch {}
      }

      try {
        const response = await axiosInstance.get(`/api/admin/dashboard/revenue?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setRevenue(response.data);
          localStorage.setItem(
            `${REVENUE_CACHE_KEY}_${days}`,
            JSON.stringify({ data: response.data, timestamp: Date.now() })
          );
        } else {
          setError("Failed to fetch revenue data");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching revenue data");
      }
    };

    const loadData = async () => {
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }
      await Promise.all([fetchStats(), fetchRevenue()]);
      setLoading(false);
    };

    loadData();
  }, [token, days]);

  useEffect(() => {
    const ctx = document.getElementById("revenue-chart") as HTMLCanvasElement;

    if (ctx && revenue.length > 0) {
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
      }

      const newChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: revenue.map(item => item.date),
          datasets: [
            {
              label: "Revenue",
              data: revenue.map(item => parseFloat(item.revenue)),
              borderColor: "#F97316",
              backgroundColor: "rgba(249, 115, 22, 0.1)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#F97316",
              tension: 0.4,
            },
            {
              label: "Order",
              data: revenue.map(item => parseFloat(item.revenue) * 0.5), // Placeholder: adjust based on actual order data
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              tension: 0.4,
              borderColor: "rgba(249, 115, 22, 0.5)",
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
                  if (context.dataset.label === "Revenue") {
                    return `₹ ${context.parsed.y}`;
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
                callback: (value) => `${value}`,
              },
            },
          },
        },
      });

      revenueChartRef.current = newChart;
    }

    return () => {
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
      }
    };
  }, [revenue]);

  const renderSkeletonStatCard = () => (
    <div className="stat-card">
      <div className="stat-icon">
        <Skeleton type="avatar" width="3rem" height="3rem" />
      </div>
      <div className="stat-content">
        <Skeleton type="text" width="80%" />
        <Skeleton type="title" width="60%" />
      </div>
    </div>
  );

  const handleDaysChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDays(parseInt(event.target.value));
  };

  return (
    <div className="vendor-dash-container">
      <AdminSidebar />
      <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
        <Header onSearch={handleSearch} showSearch={false} title="Dashboard" />
        <main
          className="dashboard__main"
          style={{
            paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px",
          }}
        >
          <div className="dashboard__stats">
            {loading ? (
              <>
                {renderSkeletonStatCard()}
                {renderSkeletonStatCard()}
                {renderSkeletonStatCard()}
                {renderSkeletonStatCard()}
              </>
            ) : error ? (
              <div style={{ color: "red", fontWeight: 500 }}>{error}</div>
            ) : stats ? (
              <>
                <StatsCard
                  title="Total Sales"
                  value={`₹ ${Number(stats.totalSales).toLocaleString("en-IN")}`}
                  iconType="sales"
                  change={0}
                  trend="up"
                  timeframe=""
                />
                <StatsCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  iconType="orders"
                  change={0}
                  trend="up"
                  timeframe=""
                />
                <StatsCard
                  title="Total Customers"
                  value={stats.totalCustomers}
                  iconType="customers"
                  change={0}
                  trend="up"
                  timeframe=""
                />
                <StatsCard
                  title="Total Vendors"
                  value={stats.totalVendors}
                  iconType="vendors"
                  change={0}
                  trend="up"
                  timeframe=""
                />
                <StatsCard
                  title="Total Products"
                  value={stats.totalProducts}
                  iconType="products"
                  change={0}
                  trend="up"
                  timeframe=""
                />
                <StatsCard
                  title="Delivered Revenue"
                  value={`₹ ${Number(stats.totalDeliveredRevenue).toLocaleString("en-IN")}`}
                  iconType="sales"
                  change={0}
                  trend="up"
                  timeframe=""
                />
              </>
            ) : null}
          </div>
          <div className="dashboard__two-columns">
            <div className="dashboard__column">
              <div className="section-card revenue-analytics">
                <div className="revenue-analytics__legend">
                  <div className="legend-item">
                    <div className="legend-item__color legend-item__color--revenue"></div>
                    <span className="legend-item__label">Revenue</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-item__color legend-item__color--order"></div>
                    <span className="legend-item__label">Order</span>
                  </div>
                </div>
              
                <div className="revenue-analytics__chart">
                  <canvas id="revenue-chart"></canvas>
                </div>
                <select className="days-selector" value={days} onChange={handleDaysChange}>
                  <option value="7">Last 7 Days</option>
                  <option value="10">Last 10 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}