import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { DetailedOrder, OrderService } from "../../services/orderService";
import { getAvailableNextStatuses, getOrderStatusMeta } from "../orderStatus";
import "../../Styles/OrderModals.css";

interface Order {
  id: string;
  firstName: string;
  lastName: string;
  date: string;
  quantity: number;
  address: string;
  phoneNumber: string;
  email: string;
  country: string;
  streetAddress: string;
  town: string;
  state: string;
  vendorName: string;
  profileImage?: string;
}

interface OrderEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (orderId: string, newStatus: string) => void;
  order: Order | null;
}

interface StatusHistoryEntry {
  id: number;
  previousStatus: string | null;
  newStatus: string;
  changedByRole: string;
  reason: string | null;
  note: string | null;
  createdAt: string;
  changedBy: { fullName?: string; username?: string; email?: string } | null;
}

const formatAddress = (shippingAddress: any, fallback: Order): string => {
  if (shippingAddress) {
    const parts = [
      shippingAddress.localAddress || shippingAddress.streetAddress,
      shippingAddress.city,
      shippingAddress.district,
      shippingAddress.province,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }

  return (
    [
      fallback.streetAddress || fallback.address,
      fallback.town,
      fallback.state,
      fallback.country,
    ]
      .filter(Boolean)
      .join(", ") || "N/A"
  );
};

const formatStatusLabel = (status: string) =>
  getOrderStatusMeta(status).label || status.replace(/_/g, " ");

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  show,
  onClose,
  onSave,
  order,
}) => {
  const { token } = useAuth();
  const [detailedOrder, setDetailedOrder] = useState<DetailedOrder | null>(
    null,
  );
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!show || !order || !token) return;

      setIsLoading(true);
      setError(null);
      setDetailedOrder(null);
      setStatusHistory([]);
      setReason("");
      setNote("");

      try {
        const [orderDetails, history] = await Promise.all([
          OrderService.getOrderById(order.id, token),
          OrderService.getOrderStatusHistory(order.id, token).catch(() => []),
        ]);
        setDetailedOrder(orderDetails);
        setOrderStatus(orderDetails.status || "");
        setStatusHistory(history);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch order details";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [show, order, token]);

  const currentStatus = detailedOrder?.status || "";
  const availableStatusOptions = useMemo(
    () => (currentStatus ? getAvailableNextStatuses(currentStatus) : []),
    [currentStatus],
  );
  const isEditable = availableStatusOptions.length > 0;
  const selectedStatusMeta = orderStatus
    ? getOrderStatusMeta(orderStatus)
    : null;
  const itemCount =
    detailedOrder?.orderItems?.reduce(
      (total, item) => total + item.quantity,
      0,
    ) ||
    order?.quantity ||
    0;
  const customerName =
    detailedOrder?.orderedBy?.fullName ||
    detailedOrder?.orderedBy?.username ||
    `${order?.firstName || "Unknown"} ${order?.lastName || "User"}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !detailedOrder || !token) return;

    if (!orderStatus || orderStatus === detailedOrder.status) {
      toast("Choose a different status before saving");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedOrder = await OrderService.updateOrderStatus(
        order.id,
        orderStatus,
        token,
        {
          expectedCurrentStatus: detailedOrder.status,
          reason: reason.trim() || undefined,
          note: note.trim() || undefined,
        },
      );
      setDetailedOrder((prev) =>
        prev ? { ...prev, status: updatedOrder.status || orderStatus } : prev,
      );
      await onSave(order.id, updatedOrder.status || orderStatus);
      toast.success("Order status updated");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update order status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!show || !order) return null;

  return (
    <div className="modal-overlay" onClick={isSaving ? undefined : onClose}>
      <div
        className="order-modal order-edit-modal order-edit-modal--modern"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="order-detail__header order-edit-modal__hero">
          <div>
            <p className="order-edit-modal__eyebrow">Edit order status</p>
            <h2 className="order-detail__order-num">
              {detailedOrder?.orderNumber || `#${order.id}`}
            </h2>
            <p className="order-detail__order-date">{order.date || "N/A"}</p>
          </div>

          <div className="order-detail__status-panel">
            <span
              className={`status-badge status-badge--${currentStatus.toLowerCase()}`}
            >
              {currentStatus ? formatStatusLabel(currentStatus) : "Loading"}
            </span>
            <span
              className={`payment-badge payment-badge--${(detailedOrder?.paymentStatus || "").toLowerCase()}`}
            >
              {detailedOrder?.paymentStatus || "N/A"}
            </span>
            <button
              type="button"
              className="order-modal__close-btn order-detail__close-btn"
              onClick={onClose}
              aria-label="Close edit order status modal"
              disabled={isSaving}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="order-modal__content">
          {isLoading ? (
            <div className="order-modal__loading order-edit-modal__loading">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="skeleton skeleton-text"
                  style={{ width: `${70 + index * 4}%` }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="order-modal__error">
              <p>{error}</p>
            </div>
          ) : (
            <form
              id="order-edit-status-form"
              className="order-edit-modal__form"
              onSubmit={handleSubmit}
            >
              <section className="order-section">
                <h3 className="order-section__title">Order summary</h3>
                <div className="order-edit-modal__summary-grid">
                  <div className="order-edit-modal__customer-card">
                    <div className="order-modal__profile">
                      {order.profileImage ? (
                        <img src={order.profileImage} alt={customerName} />
                      ) : (
                        <div className="order-modal__profile-placeholder">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3>{customerName}</h3>
                      <p>
                        {detailedOrder?.orderedBy?.email ||
                          order.email ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="order-info-grid order-edit-modal__quick-facts">
                    <div className="order-info-grid__item">
                      <span className="order-info-grid__label">Items</span>
                      <span className="order-info-grid__value">
                        {itemCount}
                      </span>
                    </div>
                    <div className="order-info-grid__item">
                      <span className="order-info-grid__label">Total</span>
                      <span className="order-info-grid__value">
                        Rs.{" "}
                        {detailedOrder
                          ? Number(detailedOrder.totalPrice).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="order-info-grid__item">
                      <span className="order-info-grid__label">Payment</span>
                      <span className="order-info-grid__value">
                        {detailedOrder?.paymentMethod || "N/A"}
                      </span>
                    </div>
                    <div className="order-info-grid__item">
                      <span className="order-info-grid__label">Phone</span>
                      <span className="order-info-grid__value">
                        {detailedOrder?.phoneNumber ||
                          order.phoneNumber ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-info-grid__item order-info-grid__item--full order-edit-modal__address">
                  <span className="order-info-grid__label">
                    Shipping address
                  </span>
                  <span className="order-info-grid__value">
                    {formatAddress(detailedOrder?.shippingAddress, order)}
                  </span>
                </div>
              </section>

              <section className="order-section">
                <h3 className="order-section__title">Status update</h3>
                {!isEditable && (
                  <div className="order-modal__info-banner">
                    This order has no valid next status.
                  </div>
                )}

                <div className="order-edit-modal__status-card">
                  <label className="order-edit-modal__field">
                    <span>New status</span>
                    <select
                      value={orderStatus}
                      onChange={(event) => setOrderStatus(event.target.value)}
                      disabled={!isEditable || isSaving}
                    >
                      <option value={currentStatus}>
                        {currentStatus
                          ? `${formatStatusLabel(currentStatus)} (current)`
                          : "Current status"}
                      </option>
                      {availableStatusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedStatusMeta && (
                    <div className="order-edit-modal__status-preview">
                      <span
                        className={`status-badge status-badge--${orderStatus.toLowerCase()}`}
                      >
                        {selectedStatusMeta.label}
                      </span>
                      <p>{selectedStatusMeta.description}</p>
                    </div>
                  )}

                  <label className="order-edit-modal__field">
                    <span>Reason</span>
                    <input
                      type="text"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Optional reason shown in internal history"
                      disabled={!isEditable || isSaving}
                    />
                  </label>

                  <label className="order-edit-modal__field">
                    <span>Note</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Optional note for this update"
                      rows={3}
                      disabled={!isEditable || isSaving}
                    />
                  </label>
                </div>
              </section>

              {statusHistory.length > 0 && (
                <section className="order-section">
                  <h3 className="order-section__title">Recent history</h3>
                  <div className="order-edit-modal__timeline">
                    {statusHistory
                      .slice(-4)
                      .reverse()
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="order-edit-modal__timeline-row"
                        >
                          <span
                            className={`status-badge status-badge--${entry.newStatus.toLowerCase()}`}
                          >
                            {formatStatusLabel(entry.newStatus)}
                          </span>
                          <div>
                            <p>
                              {new Date(entry.createdAt).toLocaleString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                            <small>
                              {entry.changedByRole.toLowerCase()}
                              {entry.reason ? ` - ${entry.reason}` : ""}
                            </small>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </form>
          )}
        </div>

        <div className="order-modal__footer">
          <button
            type="button"
            className="order-modal__button order-modal__button--secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="order-edit-status-form"
            className="order-modal__button order-modal__button--primary"
            disabled={
              !isEditable ||
              isSaving ||
              !orderStatus ||
              orderStatus === detailedOrder?.status
            }
          >
            {isSaving ? "Updating..." : "Update status"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
