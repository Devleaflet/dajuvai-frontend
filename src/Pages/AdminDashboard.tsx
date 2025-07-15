import { useState, useEffect, useRef } from "react";
import "../Styles/AdminDashboard.css";
import { Chart } from "chart.js/auto";
import Header from "../Components/Header";
import { AdminSidebar } from "../Components/AdminSidebar";
import { useDocketHeight } from "./../Hook/UseDockerHeight";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import Skeleton from "../Components/Skeleton/Skeleton";

const CACHE_KEY = "admin_dashboard_stats";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function AdminDashboard() {
  const { token } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const docketHeight = useDocketHeight();

  // Reference to store the Chart instance
  const revenueChartRef = useRef<Chart | null>(null);

  // Search handler function
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
      // Check cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (data && Date.now() - timestamp < CACHE_TTL) {
            setStats(data);
            setLoading(false);
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
            CACHE_KEY,
            JSON.stringify({ data: response.data.data, timestamp: Date.now() })
          );
        } else {
          setError("Failed to fetch dashboard stats");
        }
      } catch (err: any) {
        setError("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  // Initialize Chart.js for Revenue Chart
  useEffect(() => {
    const ctx = document.getElementById("revenue-chart") as HTMLCanvasElement;

    if (ctx) {
      // Destroy existing chart instance if it exists
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
      }

      // Create a new chart instance
      const newChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [
            "12 Aug",
            "13 Aug",
            "14 Aug",
            "15 Aug",
            "16 Aug",
            "17 Aug",
            "18 Aug",
            "19 Aug",
          ],
          datasets: [
            {
              label: "Revenue",
              data: [8000, 9500, 8500, 10000, 14000, 11000, 9000, 12000],
              borderColor: "#F97316",
              backgroundColor: "rgba(249, 115, 22, 0.1)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#F97316",
              tension: 0.4,
            },
            {
              label: "Order",
              data: [4000, 5500, 4500, 7000, 8000, 5000, 4500, 5000],
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

      // Store the new chart instance in the ref
      revenueChartRef.current = newChart;
    }

    // Cleanup function to destroy the chart when the component unmounts
    return () => {
      if (revenueChartRef.current) {
        revenueChartRef.current.destroy();
      }
    };
  }, []);

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

  return (
    <div className="vendor-dash-container">
      <AdminSidebar />
      <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
        {/* Using the new Header component instead of the original header, with search disabled */}
        <Header onSearch={handleSearch} showSearch={false} />

        {/* Added paddingBottom style to account for docketHeight */}
        <main
          className="dashboard__main"
          style={{
            paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px",
          }}
        >
          {/* Stats Section */}
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
                  value={`Rs. ${Number(stats.totalSales).toLocaleString(
                    "en-IN"
                  )}`}
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
              </>
            ) : null}
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
