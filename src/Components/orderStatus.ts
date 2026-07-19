// Single authoritative order-status definition for the frontend. Every
// order table, filter dropdown, badge, and status-update modal must import
// from here instead of declaring its own status array.
//
// Keep in sync with the backend's source of truth:
//   dajuvai-backend/src/entities/order.entity.ts (OrderStatus enum)
//   dajuvai-backend/src/constants/orderStatus.constants.ts (ORDER_STATUS_TRANSITIONS)
// There is no shared package between the two repos, so this mirror has to
// be updated by hand when the backend enum changes.

export type OrderStatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DELAYED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderStatusMeta {
  value: OrderStatusValue;
  label: string;
  description: string;
  badgeClassName: string;
}

export const ORDER_STATUS_OPTIONS: OrderStatusMeta[] = [
  { value: 'PENDING', label: 'Pending', description: 'Awaiting payment confirmation', badgeClassName: 'status-badge--pending' },
  { value: 'CONFIRMED', label: 'Confirmed', description: 'Payment confirmed, not yet being prepared', badgeClassName: 'status-badge--confirmed' },
  { value: 'PROCESSING', label: 'Processing', description: 'Vendor is preparing the order', badgeClassName: 'status-badge--processing' },
  { value: 'DELAYED', label: 'Delayed', description: 'Fulfillment is behind schedule', badgeClassName: 'status-badge--delayed' },
  { value: 'SHIPPED', label: 'Shipped', description: 'Handed to courier', badgeClassName: 'status-badge--shipped' },
  { value: 'DELIVERED', label: 'Delivered', description: 'Received by the customer', badgeClassName: 'status-badge--delivered' },
  { value: 'CANCELLED', label: 'Cancelled', description: 'Order will not be fulfilled', badgeClassName: 'status-badge--cancelled' },
  { value: 'RETURNED', label: 'Returned', description: 'Customer returned the order after delivery', badgeClassName: 'status-badge--returned' },
];

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = Object.fromEntries(
  ORDER_STATUS_OPTIONS.map((s) => [s.value, s.label]),
) as Record<OrderStatusValue, string>;

/** Mirrors backend ORDER_STATUS_TRANSITIONS exactly — the status-update
 * modal must only ever offer values from this map for the order's current
 * status, so the backend never rejects a choice the UI itself offered. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'DELAYED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  const found = ORDER_STATUS_OPTIONS.find((s) => s.value === status);
  return found ?? { value: status as OrderStatusValue, label: status, description: '', badgeClassName: 'status-badge--pending' };
}

export function getAvailableNextStatuses(currentStatus: string): OrderStatusMeta[] {
  const next = ORDER_STATUS_TRANSITIONS[currentStatus as OrderStatusValue] ?? [];
  return next.map(getOrderStatusMeta);
}
