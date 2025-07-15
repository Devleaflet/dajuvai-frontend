import { useState, useRef, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import "../Styles/Dashboard.css";
import { Sidebar } from "./Sidebar";
import { Chart } from "chart.js/auto";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import { useVendorAuth } from "../context/VendorAuthContext";
import VendorDashboardService from "../services/vendorDashboardService";
import VendorHeader from "./VendorHeader";

interface DashboardProps {
  version?: string;
}

export function Dashboard({ version = "123456" }: DashboardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
      const dashboardService = VendorDashboardService.getInstance();
      const statsRes = await dashboardService.getVendorStats(authState.token);
      // If API returns {data: {...}}, extract data
      return statsRes.data || statsRes;
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

  // Initialize Chart.js for Sales Chart
  useEffect(() => {
    const ctx = document.getElementById("sales-chart") as HTMLCanvasElement;

    if (ctx && statsData) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const newChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
          datasets: [
            {
              label: "Sales ($)",
              data: [5000, 7000, 6500, 7500, 9000, statsData.totalSales, 10000],
              borderColor: "#3B82F6",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#3B82F6",
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
                label: (context) => `$${context.parsed.y}`,
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
                callback: (value) => `$${value}`,
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
  }, [statsData]);

  if (statsLoading) {
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
          </main>
        </div>
      </div>
    );
  }
  if (statsError) return <div>Error: {statsErrorObj?.message}</div>;

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
              change={8.5}
              trend="up"
              timeframe="from yesterday"
            />
            <StatsCard
              title="Total Orders"
              value={statsData?.totalOrders?.toString() || "0"}
              iconType="orders"
              change={1.3}
              trend="up"
              timeframe="from past week"
            />
            <StatsCard
              title="Total Sales"
              value={`Rs.${statsData?.totalSales?.toFixed(2) || "0.00"}`}
              iconType="sales"
              change={4.3}
              trend="down"
              timeframe="from yesterday"
            />
            <StatsCard
              title="Total Pending"
              value={statsData?.totalPendingOrders?.toString() || "0"}
              iconType="pending"
              change={1.8}
              trend="up"
              timeframe="from yesterday"
            />
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
            {change}%
          </span>
          <span className="stats-card__timeframe">{timeframe}</span>
        </div>
      </div>
    </div>
  );
}