import { useState, useEffect } from "react";
import "../Styles/Notifications.css";
import { AdminSidebar } from "../Components/AdminSidebar";

export function AdminNotifications() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "order",
      title: "New order #1024 placed by John Doe.",
      time: "2 mins ago",
      read: false
    },
    {
      id: 2,
      type: "vendor",
      title: "Vendor 'ABC Store' approved successfully.",
      time: "1 hour ago",
      read: false
    },
    {
      id: 3,
      type: "order",
      title: "Order #1005 has been shipped.",
      time: "Yesterday",
      read: true
    },
    {
      id: 4,
      type: "system",
      title: "System maintenance scheduled for tonight.",
      time: "2 days ago",
      read: true
    }
  ]);
  const [activeTab, setActiveTab] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    // TODO: Fetch notifications from API
    // e.g., axios.get('/api/notifications').then(res => setNotifications(res.data));
  }, []);

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
      <AdminSidebar />
      <div className={`notifications-main ${isMobile ? "notifications-main--mobile" : ""}`}>
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifications</h1>
            <span className="unread-badge">({unreadCount} Unread)</span>
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
              <div key={notification.id} className={`notification-item ${notification.read ? "read" : "unread"}`}>
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
  );
}