import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/Notifications.css";
import { AdminSidebar } from "../Components/AdminSidebar";
import { Sidebar, Sidebar as VendorSidebar } from "../Components/Sidebar";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import VendorHeader from "../Components/VendorHeader";

export function Notifications() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const {token} = useAuth()
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const isVendor = location.pathname === "/vendor-notifications";

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getTypeForIcon = (apiType) => {
    switch (apiType) {
      case "ORDER_PLACED": return "order";
      case "VENDOR_APPROVED": return "vendor";
      default: return "system";
    }
  };

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get("/api/notification", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data && response.data.success) {
          const mappedNotifications = response.data.data.map(item => ({
            id: item.id,
            type: getTypeForIcon(item.type),
            title: `${item.title}: ${item.message}`,
            time: formatTime(item.createdAt),
            read: item.isRead
          }));
          setNotifications(mappedNotifications);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchNotifications();
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/notification/${id}`, { isRead: true }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    setIsMarkingAll(true);
    try {
      await Promise.allSettled(
        unread.map(n =>
          axiosInstance.patch(`/api/notification/${n.id}`, { isRead: true }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.type === 'order') {
      const match = notification.title.match(/#(\d+)/);
      if (match) {
        const orderId = match[1];
        const path = isVendor ? `/vendor-orders?orderId=${orderId}` : `/admin-orders?orderId=${orderId}`;
        navigate(path);
      }
    }
  };

  const filteredNotifications = activeTab === "Unread" 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const getIcon = (type) => {
    switch (type) {
      case "order": return "🛒";
      case "vendor": return "🏪";
      case "system": return "⚙️";
      default: return "📝";
    }
  };

  return (
    <div className="admin-layout">
      {isVendor ? <Sidebar /> : <AdminSidebar />}
      <div style={{flex:1}}>
        {!isVendor? <Header
        showSearch = {false}
        title="Notification"/>: 
        <VendorHeader
        title="Notification"
        />}
        <div className={`notifications-main ${isMobile ? "notifications-main--mobile" : ""}`}>
          <div className="notifications-container">
            <div className="notifications-header">
              <h1>Notifications</h1>
              <div className="notifications-header__right">
                <span className="unread-badge">({unreadCount} Unread)</span>
                {unreadCount > 0 && (
                  <button
                    className="mark-all-btn"
                    onClick={markAllAsRead}
                    disabled={isMarkingAll}
                  >
                    {isMarkingAll ? "Marking..." : "Mark all as read"}
                  </button>
                )}
              </div>
            </div>
            <div className="tabs">
              <button
                className={`tab ${activeTab === "All" ? "active" : ""}`}
                onClick={() => setActiveTab("All")}
              >
                All
              </button>
              <button
                className={`tab ${activeTab === "Unread" ? "active" : ""}`}
                onClick={() => setActiveTab("Unread")}
              >
                Unread
              </button>
            </div>
            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}