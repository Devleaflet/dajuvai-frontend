import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/Notifications.css";
import { AdminSidebar } from "../Components/AdminSidebar";
import { Sidebar } from "../Components/Sidebar";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import VendorHeader from "../Components/VendorHeader";

type FeedNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

type NotificationPage = {
  success?: boolean;
  data: FeedNotification[];
  total: number;
  unreadTotal: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

export function Notifications() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isVendor = location.pathname === "/vendor-notifications";
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const visible = notifications;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get<NotificationPage>(
        "/api/notification",
        {
          params: {
            page,
            limit: PAGE_SIZE,
            unreadOnly: activeTab === "unread",
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!response.data?.success)
        throw new Error("Notification request failed");
      setNotifications(response.data.data ?? []);
      setTotal(Number(response.data.total ?? 0));
      setUnreadTotal(Number(response.data.unreadTotal ?? 0));
      setTotalPages(Math.max(1, Number(response.data.totalPages ?? 1)));
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Could not load notifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, page, activeTab]);

  const markRead = async (notification: FeedNotification) => {
    if (notification.isRead) return;
    try {
      await axiosInstance.patch(`/api/notification/${notification.id}`, {
        isRead: true,
      });
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadTotal((value) => Math.max(0, value - 1));
    } catch {
      setError("Could not mark notification as read.");
    }
  };

  const openNotification = async (notification: FeedNotification) => {
    await markRead(notification);
    if (!notification.type.startsWith("ORDER")) return;
    const orderId = `${notification.title} ${notification.message}`.match(
      /#(\d+)/,
    )?.[1];
    if (orderId)
      navigate(
        isVendor
          ? `/vendor-orders?orderId=${orderId}`
          : `/admin-orders?orderId=${orderId}`,
      );
  };

  const markAllRead = async () => {
    if (!unreadTotal) return;
    setMarkingAll(true);
    try {
      await axiosInstance.patch("/api/notification/read-all");
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadTotal(0);
    } catch {
      setError("Some notifications could not be marked as read.");
      void load();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="admin-layout">
      {isVendor ? <Sidebar /> : <AdminSidebar />}
      <main className="notifications-page">
        {isVendor ? (
          <VendorHeader title="Notifications" />
        ) : (
          <Header showSearch={false} title="Notifications" />
        )}
        <section className="notifications-panel" aria-label="Notifications">
          <header className="notifications-panel__header">
            <div>
              <h1>Notifications</h1>
              <p>Updates for your account and orders.</p>
            </div>
            <div className="notifications-panel__actions">
              <span className="unread-badge">{unreadTotal} unread</span>
              <button
                className="mark-all-btn"
                disabled={!unreadTotal || markingAll}
                onClick={markAllRead}
              >
                {markingAll ? "Marking…" : "Mark all read"}
              </button>
            </div>
          </header>
          <div className="tabs" role="tablist" aria-label="Notification filter">
            <button
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("all");
                setPage(1);
              }}
            >
              All
            </button>
            <button
              className={`tab ${activeTab === "unread" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("unread");
                setPage(1);
              }}
            >
              Unread ({unreadTotal})
            </button>
          </div>
          {error && (
            <div className="notifications-error" role="alert">
              {error}
              <button onClick={load}>Retry</button>
            </div>
          )}

          {loading ? (
            <p className="notifications-empty">Loading notifications…</p>
          ) : visible.length === 0 ? (
            <p className="notifications-empty">
              {activeTab === "unread"
                ? "You are all caught up."
                : "No notifications yet."}
            </p>
          ) : (
            <div className="notifications-list">
              {visible.map((notification) => (
                <button
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                  onClick={() => void openNotification(notification)}
                >
                  <span className="notification-icon" aria-hidden>
                    {notification.type.startsWith("ORDER") ? "🛒" : "🔔"}
                  </span>
                  <span className="notification-content">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <time>
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>
                  </span>
                  {!notification.isRead && (
                    <span className="notification-new">New</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <footer className="notifications-pagination">
            <span>
              {total
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                : "No notifications"}
            </span>
            <div>
              <button
                type="button"
                onClick={() => setPage((value) => value - 1)}
                disabled={page <= 1 || loading}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => value + 1)}
                disabled={page >= totalPages || loading}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
