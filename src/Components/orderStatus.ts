// Single authoritative order-status definition for the frontend. Every
// order table, filter dropdown, badge, and status-update modal must import
// from here instead of declaring its own status array.
//
// Keep in sync with the backend's source of truth:
//   dajuvai-backend/src/entities/order.entity.ts (OrderStatus enum)
//   dajuvai-backend/src/constants/orderStatus.constants.ts (canTransition)
// There is no shared package between the two repos, so this mirror has to
// be updated by hand when the backend enum changes.
//
// Admin/staff can move to ANY status at any time (server-enforced, not
// just this file) — this module no longer gates which options the admin
// UI offers; it only supplies labels/colors and the full status list.

export type OrderStatusValue =
  | 'ORDER_PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'ARRIVED_AT_WAREHOUSE'
  | 'DELAYED'
  | 'ASSIGNED_TO_RIDER'
  | 'DELIVERED'
  | 'NOT_RECEIVED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderStatusMeta {
  value: OrderStatusValue;
  label: string;
  description: string;
  badgeClassName: string;
}

export const ORDER_STATUS_OPTIONS: OrderStatusMeta[] = [
  { value: 'ORDER_PLACED', label: 'Order Placed', description: 'Order received, awaiting confirmation', badgeClassName: 'status-badge--order_placed' },
  { value: 'CONFIRMED', label: 'Confirmed', description: 'Confirmed, will move into preparation soon', badgeClassName: 'status-badge--confirmed' },
  { value: 'PROCESSING', label: 'Processing', description: 'Vendor is preparing the order', badgeClassName: 'status-badge--processing' },
  { value: 'ARRIVED_AT_WAREHOUSE', label: 'At Warehouse', description: 'Arrived at the warehouse', badgeClassName: 'status-badge--arrived_at_warehouse' },
  { value: 'DELAYED', label: 'Delayed', description: 'Fulfillment is behind schedule', badgeClassName: 'status-badge--delayed' },
  { value: 'ASSIGNED_TO_RIDER', label: 'Out for Delivery', description: 'Handed to a delivery rider', badgeClassName: 'status-badge--assigned_to_rider' },
  { value: 'DELIVERED', label: 'Delivered', description: 'Received by the customer', badgeClassName: 'status-badge--delivered' },
  { value: 'NOT_RECEIVED', label: 'Not Received', description: 'Delivery attempt failed — customer did not receive the order', badgeClassName: 'status-badge--not_received' },
  { value: 'CANCELLED', label: 'Cancelled', description: 'Order will not be fulfilled', badgeClassName: 'status-badge--cancelled' },
  { value: 'RETURNED', label: 'Returned', description: 'Customer returned the order after delivery', badgeClassName: 'status-badge--returned' },
];

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = Object.fromEntries(
  ORDER_STATUS_OPTIONS.map((s) => [s.value, s.label]),
) as Record<OrderStatusValue, string>;

export const ALL_ORDER_STATUSES: OrderStatusValue[] = ORDER_STATUS_OPTIONS.map((s) => s.value);

const OPTIONS_BY_VALUE: Record<string, OrderStatusMeta> = Object.fromEntries(
  ORDER_STATUS_OPTIONS.map((option) => [option.value, option]),
);

/** Falls back gracefully for legacy status strings still sitting in old
 * history rows (e.g. a pre-migration "PENDING"/"SHIPPED" row) instead of
 * throwing or rendering "undefined". */
export function getOrderStatusMeta(status: string): OrderStatusMeta {
  const normalized = (status || '').toUpperCase();
  return (
    OPTIONS_BY_VALUE[normalized] ?? {
      value: normalized as OrderStatusValue,
      label: normalized || 'Unknown',
      description: '',
      badgeClassName: 'status-badge--default',
    }
  );
}

/** Every status except the current one — admin/staff can freely move to
 * any of them; the dropdown just needs to exclude the no-op "same status"
 * option. */
export function getAvailableNextStatuses(currentStatus: string): OrderStatusMeta[] {
  return ORDER_STATUS_OPTIONS.filter((option) => option.value !== currentStatus.toUpperCase());
}
