import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../Styles/RiderDelivery.css';
import {
  getRiderAssignments,
  confirmPickup,
  markDelivered,
  markFailed,
} from '../services/deliveryService';
import type { DeliveryAssignment } from '../types/delivery';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS, AssignmentStatus } from '../types/delivery';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const color = DELIVERY_STATUS_COLORS[status] ?? '#6b7280';
  const label = DELIVERY_STATUS_LABELS[status] ?? status;
  return (
    <span className="rd-badge" style={{ background: color }}>
      {label}
    </span>
  );
}

// ─── Info Row helper ──────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="rd-info-row">
      <span className="rd-info-icon">{icon}</span>
      <div>
        <div className="rd-info-label">{label}</div>
        <div className="rd-info-value">{value || 'N/A'}</div>
      </div>
    </div>
  );
}

// ─── Status Change Modal ──────────────────────────────────────────────────────
interface ModalState {
  assignment: DeliveryAssignment;
  action: 'pickup' | 'delivered' | 'failed';
}

function StatusModal({
  modal,
  onClose,
  onPickup,
  onDelivered,
  onFailed,
  submitting,
}: {
  modal: ModalState;
  onClose: () => void;
  onPickup: (id: number) => void;
  onDelivered: (id: number) => void;
  onFailed: (id: number, reason: string) => void;
  submitting: boolean;
}) {
  const [failReason, setFailReason] = useState('');
  const { assignment, action } = modal;
  const orderId = assignment.orderId;
  const order = assignment.order;

  const address = order?.shippingAddress
    ? [order.shippingAddress.localAddress, order.shippingAddress.city, order.shippingAddress.district]
        .filter(Boolean)
        .join(', ')
    : 'N/A';

  return (
    <div className="rd-modal-overlay" onClick={onClose}>
      <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rd-modal-header">
          <div>
            <p className="rd-modal-order-label">Order</p>
            <h2 className="rd-modal-order-id">#{orderId}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge status={assignment.assignmentStatus} />
            <button className="rd-modal-close" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* Order Details */}
        <div className="rd-modal-body">
          <div className="rd-modal-section-title">Delivery Details</div>
          <div className="rd-modal-detail-grid">
            <InfoRow icon="👤" label="Customer" value={order?.orderedBy?.username} />
            <InfoRow icon="📞" label="Phone" value={order?.orderedBy?.phoneNumber} />
            <InfoRow icon="📍" label="Address" value={address} />
            <InfoRow
              icon="💰"
              label="Total Amount"
              value={order ? `Rs. ${parseFloat(String(order.totalPrice)).toFixed(2)}` : undefined}
            />
            <InfoRow
              icon="💳"
              label="Payment"
              value={order?.paymentMethod?.replace(/_/g, ' ')}
            />
            <InfoRow
              icon="📅"
              label="Assigned At"
              value={
                assignment.createdAt
                  ? new Date(assignment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : undefined
              }
            />
            {assignment.pickedUpAt && (
              <InfoRow
                icon="📦"
                label="Picked Up At"
                value={new Date(assignment.pickedUpAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            )}
            {assignment.failureReason && (
              <InfoRow icon="⚠️" label="Failure Reason" value={
                <span style={{ color: '#ef4444' }}>{assignment.failureReason}</span>
              } />
            )}
          </div>

          {/* Order Items */}
          {order?.orderItems && order.orderItems.length > 0 && (
            <>
              <div className="rd-modal-section-title" style={{ marginTop: '1.25rem' }}>
                Items ({order.orderItems.length})
              </div>
              <div className="rd-modal-items">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="rd-modal-item">
                    <span className="rd-modal-item-name">
                      {item.product?.name ?? `Product #${item.productId}`}
                    </span>
                    <span className="rd-modal-item-qty">×{item.quantity}</span>
                    <span className="rd-modal-item-price">
                      Rs. {parseFloat(String(item.price)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Section */}
        <div className="rd-modal-footer">
          {action === 'pickup' && (
            <div className="rd-modal-action-panel rd-modal-action-panel--blue">
              <p className="rd-modal-action-desc">
                Confirm that you have picked up this order from the warehouse and are ready to deliver.
              </p>
              <div className="rd-modal-action-btns">
                <button className="rd-btn rd-btn--cancel" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="rd-btn rd-btn--pickup"
                  onClick={() => onPickup(orderId)}
                  disabled={submitting}
                >
                  {submitting ? '⏳ Confirming...' : '📦 Confirm Pickup'}
                </button>
              </div>
            </div>
          )}

          {action === 'delivered' && (
            <div className="rd-modal-action-panel rd-modal-action-panel--green">
              <p className="rd-modal-action-desc">
                Confirm that this order has been successfully delivered to the customer.
              </p>
              <div className="rd-modal-action-btns">
                <button className="rd-btn rd-btn--cancel" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="rd-btn rd-btn--delivered"
                  onClick={() => onDelivered(orderId)}
                  disabled={submitting}
                >
                  {submitting ? '⏳ Marking...' : '✅ Mark as Delivered'}
                </button>
              </div>
            </div>
          )}

          {action === 'failed' && (
            <div className="rd-modal-action-panel rd-modal-action-panel--red">
              <label className="rd-modal-fail-label">Reason for failure *</label>
              <textarea
                className="rd-modal-fail-input"
                rows={3}
                placeholder="e.g. Customer not available, Wrong address, No one home..."
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
              />
              <div className="rd-modal-action-btns">
                <button className="rd-btn rd-btn--cancel" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="rd-btn rd-btn--failed-submit"
                  onClick={() => onFailed(orderId, failReason)}
                  disabled={submitting || !failReason.trim()}
                >
                  {submitting ? '⏳ Submitting...' : '❌ Mark as Failed'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RiderDelivery: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRiderAssignments();
      setAssignments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const openModal = (assignment: DeliveryAssignment, action: ModalState['action']) => {
    setModal({ assignment, action });
  };

  const closeModal = () => {
    if (!submitting) setModal(null);
  };

  const handlePickup = async (orderId: number) => {
    try {
      setSubmitting(true);
      await confirmPickup(orderId);
      toast.success('Pickup confirmed! Order is now Out for Delivery.');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to confirm pickup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelivered = async (orderId: number) => {
    try {
      setSubmitting(true);
      await markDelivered(orderId);
      toast.success('Order marked as Delivered! 🎉');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark as delivered');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFailed = async (orderId: number, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please enter a failure reason');
      return;
    }
    try {
      setSubmitting(true);
      await markFailed(orderId, reason.trim());
      toast.success('Delivery marked as failed.');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render States ───────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="rd-page">
        <div className="rd-loading">
          <div className="rd-spinner" />
          <span>Loading your assignments...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rd-page">
        <div className="rd-error">Please log in to view your delivery assignments.</div>
      </div>
    );
  }

  // Partition assignments
  const active = assignments.filter(
    (a) => a.assignmentStatus === AssignmentStatus.ASSIGNED || a.assignmentStatus === AssignmentStatus.PICKED_UP
  );
  const completed = assignments.filter(
    (a) => a.assignmentStatus === AssignmentStatus.DELIVERED || a.assignmentStatus === AssignmentStatus.FAILED
  );

  return (
    <div className="rd-page">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="rd-page-header">
        <button className="rd-back-btn" onClick={() => navigate(-1)} title="Go Back">
          ← Back
        </button>
        <div className="rd-header-text">
          <h1 className="rd-page-title">🏍️ My Deliveries</h1>
          <p className="rd-page-subtitle">
            {active.length} active · {completed.length} completed
          </p>
        </div>
        <button className="rd-refresh-btn" onClick={load} title="Refresh">
          ↻ Refresh
        </button>
      </div>

      {error && <div className="rd-error">{error}</div>}

      {assignments.length === 0 ? (
        <div className="rd-empty">
          <div className="rd-empty-icon">📭</div>
          <div className="rd-empty-title">No assignments yet</div>
          <p className="rd-empty-sub">When orders are assigned to you, they'll appear here.</p>
        </div>
      ) : (
        <div className="rd-content">
          {/* ── Active Assignments ───────── */}
          {active.length > 0 && (
            <section className="rd-section">
              <h2 className="rd-section-title">Active ({active.length})</h2>
              <div className="rd-grid">
                {active.map((assignment) => {
                  const order = assignment.order;
                  const status = assignment.assignmentStatus;
                  const address = order?.shippingAddress
                    ? [
                        order.shippingAddress.localAddress,
                        order.shippingAddress.city,
                        order.shippingAddress.district,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : 'N/A';

                  return (
                    <div key={assignment.id} className="rd-card rd-card--active">
                      {/* Card Top */}
                      <div className="rd-card-top">
                        <div className="rd-card-id">Order #{assignment.orderId}</div>
                        <StatusBadge status={status} />
                      </div>

                      {/* Card Info */}
                      <div className="rd-card-info">
                        <div className="rd-card-detail">
                          <span className="rd-card-detail-icon">👤</span>
                          <span>{order?.orderedBy?.username ?? 'N/A'}</span>
                        </div>
                        <div className="rd-card-detail">
                          <span className="rd-card-detail-icon">📞</span>
                          <span>{order?.orderedBy?.phoneNumber ?? 'N/A'}</span>
                        </div>
                        <div className="rd-card-detail rd-card-detail--full">
                          <span className="rd-card-detail-icon">📍</span>
                          <span>{address}</span>
                        </div>
                        <div className="rd-card-detail">
                          <span className="rd-card-detail-icon">💰</span>
                          <span>
                            {order ? `Rs. ${parseFloat(String(order.totalPrice)).toFixed(2)}` : 'N/A'}
                          </span>
                        </div>
                        <div className="rd-card-detail">
                          <span className="rd-card-detail-icon">💳</span>
                          <span>{order?.paymentMethod?.replace(/_/g, ' ') ?? 'N/A'}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="rd-card-actions">
                        <button
                          className="rd-card-action-btn rd-card-action-btn--detail"
                          onClick={() => openModal(assignment, status === AssignmentStatus.ASSIGNED ? 'pickup' : 'delivered')}
                        >
                          {status === AssignmentStatus.ASSIGNED
                            ? '📦 Confirm Pickup'
                            : '✅ Mark Delivered'}
                        </button>
                        <button
                          className="rd-card-action-btn rd-card-action-btn--fail"
                          onClick={() => openModal(assignment, 'failed')}
                        >
                          ❌ Report Failure
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Completed Assignments ───── */}
          {completed.length > 0 && (
            <section className="rd-section">
              <h2 className="rd-section-title">History ({completed.length})</h2>
              <div className="rd-grid">
                {completed.map((assignment) => {
                  const order = assignment.order;
                  const status = assignment.assignmentStatus;
                  const address = order?.shippingAddress
                    ? [
                        order.shippingAddress.localAddress,
                        order.shippingAddress.city,
                        order.shippingAddress.district,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : 'N/A';

                  return (
                    <div key={assignment.id} className="rd-card rd-card--completed">
                      <div className="rd-card-top">
                        <div className="rd-card-id">Order #{assignment.orderId}</div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="rd-card-info">
                        <div className="rd-card-detail">
                          <span className="rd-card-detail-icon">👤</span>
                          <span>{order?.orderedBy?.username ?? 'N/A'}</span>
                        </div>
                        <div className="rd-card-detail rd-card-detail--full">
                          <span className="rd-card-detail-icon">📍</span>
                          <span>{address}</span>
                        </div>
                        {assignment.failureReason && (
                          <div className="rd-card-detail rd-card-detail--full rd-card-detail--fail">
                            <span className="rd-card-detail-icon">⚠️</span>
                            <span>{assignment.failureReason}</span>
                          </div>
                        )}
                        {assignment.deliveredAt && (
                          <div className="rd-card-detail">
                            <span className="rd-card-detail-icon">✅</span>
                            <span>
                              {new Date(assignment.deliveredAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────── */}
      {modal && (
        <StatusModal
          modal={modal}
          onClose={closeModal}
          onPickup={handlePickup}
          onDelivered={handleDelivered}
          onFailed={handleFailed}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default RiderDelivery;
