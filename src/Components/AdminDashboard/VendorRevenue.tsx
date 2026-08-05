import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

interface RevenueData {
  vendorId: string | number;
  vendorName: string;
  revenue: string | number;
}

const RevenueByVendor = () => {
  const { token, isAuthenticated } = useAuth();
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const [startDate, setStartDate] = useState(
    monthAgo.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    if (!startDate || !endDate || !isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.999Z`,
    });
    fetch(
      `${API_BASE_URL}/api/admin/dashboard/analytics/vendor/revenue?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((response) => {
        if (!cancelled)
          setData(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endDate, isAuthenticated, startDate, token]);

  const chartData = data.map((item) => ({
    ...item,
    revenue: Number(item.revenue) || 0,
    displayName:
      item.vendorName.length > 18
        ? `${item.vendorName.slice(0, 15)}...`
        : item.vendorName,
  }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Revenue by Vendor</h1>
      <div style={styles.filterRow}>
        <label style={styles.labelGroup}>
          <span style={styles.label}>Start Date</span>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => setStartDate(event.target.value)}
            style={styles.dateInput}
          />
        </label>
        <label style={styles.labelGroup}>
          <span style={styles.label}>End Date</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(event) => setEndDate(event.target.value)}
            style={styles.dateInput}
          />
        </label>
      </div>
      {loading ? (
        <div style={styles.noData}>Loading revenue…</div>
      ) : error ? (
        <div style={styles.noData}>Revenue unavailable</div>
      ) : chartData.length === 0 ? (
        <div style={styles.noData}>No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayName"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) =>
                `Rs. ${value.toLocaleString("en-IN")}`
              }
              labelFormatter={(label) =>
                chartData.find((item) => item.displayName === label)
                  ?.vendorName || label
              }
            />
            <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: "1.5rem",
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "none",
    margin: 0,
    padding: "24px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "24px",
    textAlign: "center",
    color: "#1f2937",
  },
  filterRow: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  labelGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "6px",
  },
  label: { fontSize: "14px", fontWeight: "600", color: "#374151" },
  dateInput: {
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "#fff",
    minWidth: "160px",
  },
  noData: {
    height: "240px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    marginTop: "8px",
  },
};

export default RevenueByVendor;
