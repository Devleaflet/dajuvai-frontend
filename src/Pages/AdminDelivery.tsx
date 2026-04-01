import React, { useState, useEffect, useCallback } from 'react';
import { AdminSidebar } from '../Components/AdminSidebar';
import Header from '../Components/Header';
import Pagination from '../Components/Pagination';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import '../Styles/AdminDelivery.css';
import {
  getProcessingOrders,
  getProcessingOrder,
  collectItem,
  markAtWarehouse,
  getWarehouseQueue,
  assignRider,
  getAllAssignments,
  getAllRiders,
  getRiderById,
  createRider,
  getFailedOrders,
  resetFailedOrder,
} from '../services/deliveryService';
import type {
  Order,
  OrderItem,
  DeliveryAssignment,
  Rider,
} from '../types/delivery';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '../types/delivery';

type Tab = 'processing' | 'queue' | 'assignments' | 'riders' | 'failed';

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'processing', label: '🔄 Processing Orders' },
  { key: 'queue', label: '📦 Warehouse Queue' },
  { key: 'assignments', label: '📋 All Assignments' },
  { key: 'riders', label: '🏍️ Riders' },
  { key: 'failed', label: '⚠️ Failed Recovery' },
];

function StatusBadge({ status }: { status: string }) {
  const color = DELIVERY_STATUS_COLORS[status] ?? '#6b7280';
  const label = DELIVERY_STATUS_LABELS[status] ?? status;
  return (
    <span className="admin-delivery__badge" style={{ background: color }}>
      {label}
    </span>
  );
}

// ─── Processing Orders Tab ──────────────────────────────────────────────────

function ProcessingTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [collectingItem, setCollectingItem] = useState<number | null>(null);
  const [markingWarehouse, setMarkingWarehouse] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProcessingOrders();
      setOrders(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load processing orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = async (orderId: number) => {
    try {
      setLoadingOrder(true);
      const data = await getProcessingOrder(orderId);
      setSelectedOrder(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load order');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleCollect = async (itemId: number) => {
    try {
      setCollectingItem(itemId);
      await collectItem(itemId);
      toast.success('Item marked as collected');
      // Re-fetch the order detail to update item states
      if (selectedOrder) {
        const updated = await getProcessingOrder(selectedOrder.id);
        setSelectedOrder(updated);
        // Also refresh list (order may have moved status)
        load();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to collect item');
    } finally {
      setCollectingItem(null);
    }
  };

  const handleMarkWarehouse = async (orderId: number) => {
    try {
      setMarkingWarehouse(orderId);
      await markAtWarehouse(orderId);
      toast.success('Order marked as At Warehouse');
      setSelectedOrder(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark at warehouse');
    } finally {
      setMarkingWarehouse(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-delivery__loading">
        <div className="admin-delivery__spinner" />
        Loading processing orders...
      </div>
    );
  }

  if (selectedOrder) {
    const items: OrderItem[] = selectedOrder.orderItems ?? [];
    const allCollected = items.length > 0 && items.every((i) => i.collectedAtWarehouse);

    return (
      <div className="admin-delivery__detail-panel">
        <button className="admin-delivery__detail-back" onClick={() => setSelectedOrder(null)}>
          ← Back to list
        </button>
        <div className="admin-delivery__section-header">
          <h3 className="admin-delivery__section-title">Order #{selectedOrder.id}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={selectedOrder.deliveryStatus ?? selectedOrder.status} />
            <button
              className="admin-delivery__btn admin-delivery__btn--warning"
              onClick={() => handleMarkWarehouse(selectedOrder.id)}
              disabled={markingWarehouse === selectedOrder.id}
            >
              {markingWarehouse === selectedOrder.id ? 'Marking...' : '🏭 Mark At Warehouse'}
            </button>
          </div>
        </div>

        {/* Customer & Address Info */}
        <div className="admin-delivery__detail-grid">
          <div>
            <div className="admin-delivery__detail-label">Customer</div>
            <div className="admin-delivery__detail-value">
              {selectedOrder.orderedBy?.username ?? 'N/A'}
            </div>
          </div>
          <div>
            <div className="admin-delivery__detail-label">Email</div>
            <div className="admin-delivery__detail-value">
              {selectedOrder.orderedBy?.email ?? 'N/A'}
            </div>
          </div>
          <div>
            <div className="admin-delivery__detail-label">Shipping Address</div>
            <div className="admin-delivery__detail-value">
              {selectedOrder.shippingAddress
                ? [
                    selectedOrder.shippingAddress.localAddress,
                    selectedOrder.shippingAddress.city,
                    selectedOrder.shippingAddress.district,
                    selectedOrder.shippingAddress.province,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : 'N/A'}
            </div>
          </div>
          <div>
            <div className="admin-delivery__detail-label">Total</div>
            <div className="admin-delivery__detail-value">
              Rs. {parseFloat(String(selectedOrder.totalPrice)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Items */}
        <h4 style={{ margin: '1rem 0 0.5rem', color: '#374151', fontWeight: 600 }}>
          Order Items {allCollected && <span style={{ color: '#10b981' }}>✓ All Collected</span>}
        </h4>
        {loadingOrder ? (
          <div className="admin-delivery__loading">
            <div className="admin-delivery__spinner" />
          </div>
        ) : (
          <div className="admin-delivery__items-list">
            {items.map((item) => (
              <div key={item.id} className="admin-delivery__item-row">
                <div className="admin-delivery__item-info">
                  <div className="admin-delivery__item-name">
                    {item.product?.name ?? `Product #${item.productId}`}
                  </div>
                  <div className="admin-delivery__item-meta">
                    Qty: {item.quantity} &nbsp;·&nbsp; Rs.{' '}
                    {parseFloat(String(item.price)).toFixed(2)}
                  </div>
                </div>
                {item.collectedAtWarehouse ? (
                  <span className="admin-delivery__item-collected">✓ Collected</span>
                ) : (
                  <button
                    className="admin-delivery__btn admin-delivery__btn--success admin-delivery__btn--sm"
                    onClick={() => handleCollect(item.id)}
                    disabled={collectingItem === item.id}
                  >
                    {collectingItem === item.id ? 'Collecting...' : '✓ Collect'}
                  </button>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No items found.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="admin-delivery__section-header">
        <h3 className="admin-delivery__section-title">Processing Orders</h3>
        <button className="admin-delivery__btn admin-delivery__btn--ghost" onClick={load}>
          ↻ Refresh
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="admin-delivery__empty">
          <div className="admin-delivery__empty-icon">📭</div>
          No orders currently processing
        </div>
      ) : (
        <div className="admin-delivery__table-wrap">
          <table className="admin-delivery__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.orderedBy?.username ?? 'N/A'}</td>
                  <td>{order.orderItems?.length ?? 0} item(s)</td>
                  <td>Rs. {parseFloat(String(order.totalPrice)).toFixed(2)}</td>
                  <td>
                    <StatusBadge status={order.deliveryStatus ?? order.status} />
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>
                    <button
                      className="admin-delivery__btn admin-delivery__btn--primary admin-delivery__btn--sm"
                      onClick={() => openOrder(order.id)}
                    >
                      View Items
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Warehouse Queue Tab ────────────────────────────────────────────────────

function WarehouseQueueTab({ token: _token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRiders, setSelectedRiders] = useState<Record<number, number>>({});
  const [assigning, setAssigning] = useState<number | null>(null);
  const [markingWarehouse, setMarkingWarehouse] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [queueRes, ridersRes] = await Promise.all([
        getWarehouseQueue(page),
        getAllRiders(),
      ]);
      // Handle both array and paginated response shapes
      const items = Array.isArray(queueRes)
        ? (queueRes as Order[])
        : (queueRes as any).data?.orders ?? (queueRes as any).data ?? [];
      const tp =
        Array.isArray(queueRes) ? 1 : (queueRes as any).totalPages ?? 1;
      setOrders(items);
      setTotalPages(tp);
      setRiders(ridersRes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (orderId: number) => {
    const riderId = selectedRiders[orderId];
    if (!riderId) {
      toast.error('Please select a rider first');
      return;
    }
    try {
      setAssigning(orderId);
      await assignRider(orderId, riderId);
      toast.success('Rider assigned successfully!');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign rider');
    } finally {
      setAssigning(null);
    }
  };

  const handleMarkWarehouse = async (orderId: number) => {
    try {
      setMarkingWarehouse(orderId);
      await markAtWarehouse(orderId);
      toast.success('Order marked At Warehouse');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setMarkingWarehouse(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-delivery__loading">
        <div className="admin-delivery__spinner" />
        Loading warehouse queue...
      </div>
    );
  }

  return (
    <>
      <div className="admin-delivery__section-header">
        <h3 className="admin-delivery__section-title">Warehouse Queue</h3>
        <button className="admin-delivery__btn admin-delivery__btn--ghost" onClick={load}>
          ↻ Refresh
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="admin-delivery__empty">
          <div className="admin-delivery__empty-icon">📦</div>
          No orders in the warehouse queue
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="admin-delivery__detail-panel" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>
                  Order #{order.id}
                </span>
                &nbsp;&nbsp;
                <StatusBadge status={order.deliveryStatus ?? order.status} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="admin-delivery__btn admin-delivery__btn--warning admin-delivery__btn--sm"
                  onClick={() => handleMarkWarehouse(order.id)}
                  disabled={markingWarehouse === order.id}
                >
                  {markingWarehouse === order.id ? '...' : '🏭 Mark At Warehouse'}
                </button>
                <button
                  className="admin-delivery__btn admin-delivery__btn--ghost admin-delivery__btn--sm"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  {expandedOrder === order.id ? '▲ Hide Details' : '▼ Show Details'}
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="admin-delivery__detail-grid" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <div className="admin-delivery__detail-label">Customer</div>
                <div className="admin-delivery__detail-value">{order.orderedBy?.username ?? 'N/A'}</div>
              </div>
              <div>
                <div className="admin-delivery__detail-label">Email</div>
                <div className="admin-delivery__detail-value">{order.orderedBy?.email ?? 'N/A'}</div>
              </div>
              <div>
                <div className="admin-delivery__detail-label">Address</div>
                <div className="admin-delivery__detail-value">
                  {order.shippingAddress
                    ? [
                        order.shippingAddress.localAddress,
                        order.shippingAddress.city,
                        order.shippingAddress.district,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="admin-delivery__detail-label">Total</div>
                <div className="admin-delivery__detail-value">
                  Rs. {parseFloat(String(order.totalPrice)).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Expanded Items */}
            {expandedOrder === order.id && order.orderItems && (
              <div className="admin-delivery__items-list" style={{ marginBottom: '0.75rem' }}>
                {order.orderItems.map((item) => (
                  <div key={item.id} className="admin-delivery__item-row">
                    <div className="admin-delivery__item-info">
                      <div className="admin-delivery__item-name">{item.product?.name ?? `Product #${item.productId}`}</div>
                      <div className="admin-delivery__item-meta">Qty: {item.quantity} · Rs. {parseFloat(String(item.price)).toFixed(2)}</div>
                    </div>
                    {item.collectedAtWarehouse && <span className="admin-delivery__item-collected">✓ Collected</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Rider Assignment */}
            <div className="admin-delivery__assign-row">
              <select
                className="admin-delivery__select"
                value={selectedRiders[order.id] ?? ''}
                onChange={(e) =>
                  setSelectedRiders((prev) => ({
                    ...prev,
                    [order.id]: Number(e.target.value),
                  }))
                }
              >
                <option value="">Select Rider...</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.name || r.fullName || 'Unknown')} — {r.phoneNumber}
                  </option>
                ))}
              </select>
              <button
                className="admin-delivery__btn admin-delivery__btn--primary"
                onClick={() => handleAssign(order.id)}
                disabled={assigning === order.id || !selectedRiders[order.id]}
              >
                {assigning === order.id ? 'Assigning...' : '🏍️ Assign Rider'}
              </button>
            </div>
          </div>
        ))
      )}
      {totalPages > 1 && (
        <div className="admin-delivery__pagination">
          <span className="admin-delivery__pagination-info">Page {page} of {totalPages}</span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}

// ─── All Assignments Tab ────────────────────────────────────────────────────

function AssignmentsTab({ token: _token }: { token: string }) {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllAssignments(page);
      const items = Array.isArray(res) ? (res as DeliveryAssignment[]) : res.assignments ?? [];
      const tp = Array.isArray(res) ? 1 : res.pagination.totalPages ?? 1;
      setAssignments(items);
      setTotalPages(tp);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="admin-delivery__loading">
        <div className="admin-delivery__spinner" />
        Loading assignments...
      </div>
    );
  }

  return (
    <>
      <div className="admin-delivery__section-header">
        <h3 className="admin-delivery__section-title">All Assignments</h3>
        <button className="admin-delivery__btn admin-delivery__btn--ghost" onClick={load}>
          ↻ Refresh
        </button>
      </div>
      {assignments.length === 0 ? (
        <div className="admin-delivery__empty">
          <div className="admin-delivery__empty-icon">📋</div>
          No assignments yet
        </div>
      ) : (
        <div className="admin-delivery__table-wrap">
          <table className="admin-delivery__table">
            <thead>
              <tr>
                <th>Assignment ID</th>
                <th>Order ID</th>
                <th>Rider</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Assigned At</th>
                <th>Failed Reason</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td>#{a.orderId}</td>
                  <td>{a.rider?.name || a.rider?.fullName || 'N/A'}</td>
                  <td>{a.rider?.phoneNumber ?? 'N/A'}</td>
                  <td><StatusBadge status={a.assignmentStatus} /></td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</td>
                  <td style={{ color: '#ef4444', fontSize: '0.8125rem' }}>
                    {a.failureReason ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="admin-delivery__pagination">
          <span className="admin-delivery__pagination-info">Page {page} of {totalPages}</span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}

// ─── Riders Tab ─────────────────────────────────────────────────────────────

function RidersTab({ token: _token }: { token: string }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllRiders();
      setRiders(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('All fields are required');
      return;
    }
    try {
      setCreating(true);
      await createRider({
        fullName: newName.trim(),
        email: newEmail.trim(),
        phoneNumber: newPhone.trim(),
        password: newPassword.trim()
      });
      toast.success('Rider created successfully!');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create rider');
    } finally {
      setCreating(false);
    }
  };

  const viewRider = async (riderId: number) => {
    try {
      const data = await getRiderById(riderId);
      setSelectedRider(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load rider');
    }
  };

  if (loading) {
    return (
      <div className="admin-delivery__loading">
        <div className="admin-delivery__spinner" />
        Loading riders...
      </div>
    );
  }

  if (selectedRider) {
    return (
      <div className="admin-delivery__rider-detail">
        <button className="admin-delivery__detail-back" onClick={() => setSelectedRider(null)}>
          ← Back to riders
        </button>
        <div className="admin-delivery__section-header">
          <h3 className="admin-delivery__section-title">Rider Profile</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="admin-delivery__rider-avatar" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
            {(selectedRider.name || selectedRider.fullName || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.1rem' }}>{selectedRider.name || selectedRider.fullName || 'Unknown'}</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{selectedRider.phoneNumber}</div>
          </div>
        </div>
        <div className="admin-delivery__detail-grid">
          <div>
            <div className="admin-delivery__detail-label">Rider ID</div>
            <div className="admin-delivery__detail-value">#{selectedRider.id}</div>
          </div>
          {selectedRider.userId && (
            <div>
              <div className="admin-delivery__detail-label">Linked User ID</div>
              <div className="admin-delivery__detail-value">#{selectedRider.userId}</div>
            </div>
          )}
          {selectedRider.createdAt && (
            <div>
              <div className="admin-delivery__detail-label">Created</div>
              <div className="admin-delivery__detail-value">
                {new Date(selectedRider.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-delivery__section-header">
        <h3 className="admin-delivery__section-title">Riders ({riders.length})</h3>
        <button
          className="admin-delivery__btn admin-delivery__btn--primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New Rider'}
        </button>
      </div>

      {showForm && (
        <form className="admin-delivery__form" onSubmit={handleCreate}>
          <div className="admin-delivery__form-title">New Rider</div>
          <div className="admin-delivery__form-group">
            <label className="admin-delivery__form-label">Full Name *</label>
            <input
              type="text"
              className="admin-delivery__form-input"
              placeholder="e.g. Ram Bahadur"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="admin-delivery__form-group">
            <label className="admin-delivery__form-label">Phone Number *</label>
            <input
              type="tel"
              className="admin-delivery__form-input"
              placeholder="e.g. 98XXXXXXXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
          </div>
          <div className="admin-delivery__form-group">
            <label className="admin-delivery__form-label">Email *</label>
            <input
              type="email"
              className="admin-delivery__form-input"
              placeholder="e.g. rider@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-delivery__form-group">
            <label className="admin-delivery__form-label">Password *</label>
            <input
              type="password"
              className="admin-delivery__form-input"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="admin-delivery__form-actions">
            <button
              type="submit"
              className="admin-delivery__btn admin-delivery__btn--success"
              disabled={creating}
            >
              {creating ? 'Creating...' : '✓ Create Rider'}
            </button>
            <button
              type="button"
              className="admin-delivery__btn admin-delivery__btn--ghost"
              onClick={() => { setShowForm(false); setNewName(''); setNewEmail(''); setNewPhone(''); setNewPassword(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {riders.length === 0 ? (
        <div className="admin-delivery__empty">
          <div className="admin-delivery__empty-icon">🏍️</div>
          No riders yet. Create one above.
        </div>
      ) : (
        <div className="admin-delivery__rider-grid">
          {riders.map((rider) => (
            <div
              key={rider.id}
              className="admin-delivery__rider-card"
              onClick={() => viewRider(rider.id)}
            >
              <div className="admin-delivery__rider-avatar">
                {(rider.name || rider.fullName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="admin-delivery__rider-name">{rider.name || rider.fullName || 'Unknown'}</div>
              <div className="admin-delivery__rider-phone">📞 {rider.phoneNumber}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                ID #{rider.id} · Click to view
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Failed Recovery Tab ────────────────────────────────────────────────────

function FailedRecoveryTab({ token: _token }: { token: string }) {
  const [failedAssignments, setFailedAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFailedOrders();
      setFailedAssignments(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load failed deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReset = async (orderId: number) => {
    try {
      setResetting(orderId);
      await resetFailedOrder(orderId);
      toast.success('Order reset to warehouse successfully');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reset order');
    } finally {
      setResetting(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-delivery__loading">
        <div className="admin-delivery__spinner" />
        Loading failed deliveries...
      </div>
    );
  }

  return (
    <>
      <div className="admin-delivery__section-header">
        <h3 className="admin-delivery__section-title">Failed Delivery Recovery</h3>
        <button className="admin-delivery__btn admin-delivery__btn--ghost" onClick={load}>
          ↻ Refresh
        </button>
      </div>
      {failedAssignments.length === 0 ? (
        <div className="admin-delivery__empty">
          <div className="admin-delivery__empty-icon">✅</div>
          No failed deliveries to recover
        </div>
      ) : (
        <div className="admin-delivery__table-wrap">
          <table className="admin-delivery__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Rider</th>
                <th>Failed Reason</th>
                <th>Failed At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {failedAssignments.map((a) => (
                <tr key={a.id}>
                  <td>#{a.orderId}</td>
                  <td>{a.rider?.name ?? 'N/A'}</td>
                  <td style={{ color: '#b91c1c', fontSize: '0.8125rem', maxWidth: 240 }}>
                    {a.failureReason ?? '—'}
                  </td>
                  <td>
                    {a.updatedAt
                      ? new Date(a.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="admin-delivery__btn admin-delivery__btn--warning admin-delivery__btn--sm"
                      onClick={() => handleReset(a.orderId)}
                      disabled={resetting === a.orderId}
                    >
                      {resetting === a.orderId ? 'Resetting...' : '🔄 Reset to Warehouse'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const AdminDelivery: React.FC = () => {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('processing');

  if (authLoading) {
    return (
      <div className="admin-delivery">
        <AdminSidebar />
        <div className="admin-delivery__content">
          <div className="admin-delivery__loading">
            <div className="admin-delivery__spinner" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="admin-delivery">
        <AdminSidebar />
        <div className="admin-delivery__content">
          <div className="admin-delivery__loading">Please log in to access delivery management.</div>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'processing':
        return <ProcessingTab token={token} />;
      case 'queue':
        return <WarehouseQueueTab token={token} />;
      case 'assignments':
        return <AssignmentsTab token={token} />;
      case 'riders':
        return <RidersTab token={token} />;
      case 'failed':
        return <FailedRecoveryTab token={token} />;
    }
  };

  return (
    <div className="admin-delivery">
      <AdminSidebar />
      <div className="admin-delivery__content">
        <Header
          title="Delivery Management"
          showSearch={false}
        />
        <div className="admin-delivery__body">
          <div className="admin-delivery__tabs">
            {TAB_LABELS.map(({ key, label }) => (
              <button
                key={key}
                className={`admin-delivery__tab${activeTab === key ? ' admin-delivery__tab--active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {renderTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminDelivery;
