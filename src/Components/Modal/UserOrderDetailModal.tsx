import React, { useState, useEffect } from 'react';
import { OrderService, DetailedOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { getOrderStatusMeta } from '../orderStatus';
import '../../Styles/OrderModals.css';
import defaultProductImage from '../../assets/logo.webp';

interface UserOrderDetailModalProps {
  show: boolean;
  onClose: () => void;
  orderId: number | string | null;
}

const UserOrderDetailModal: React.FC<UserOrderDetailModalProps> = ({
  show,
  onClose,
  orderId,
}) => {
  const { token } = useAuth();
  const [detailedOrder, setDetailedOrder] = useState<DetailedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!show || !orderId || !token) return;
      setIsLoading(true);
      setError(null);
      try {
        const orderDetails = await OrderService.getOrderById(String(orderId), token);
        setDetailedOrder(orderDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [show, orderId, token]);

  if (!show || !orderId) return null;

  const formatAddress = (addr: any) => {
    if (!addr) return 'N/A';
    return [addr.localAddress || addr.streetAddress, addr.city, addr.district, addr.province]
      .filter(Boolean)
      .join(', ');
  };

  // Groups items by vendor for display; shipping fee/zone always come from
  // the backend's persisted vendorShippingBreakdown snapshot — never
  // recomputed here.
  const groupItemsByVendor = () => {
    if (!detailedOrder?.orderItems) return [];
    const map = new Map<number, {
      vendorId: number;
      vendorName: string;
      vendorDistrict: string;
      items: typeof detailedOrder.orderItems;
      subtotal: number;
    }>();

    for (const item of detailedOrder.orderItems) {
      const vid = item.vendorId;
      const existing = map.get(vid);
      if (existing) {
        existing.items.push(item);
        existing.subtotal += Number(item.price) * item.quantity;
      } else {
        map.set(vid, {
          vendorId: vid,
          vendorName: item.vendor?.businessName || 'Vendor',
          vendorDistrict: item.vendor?.district?.name || '',
          items: [item],
          subtotal: Number(item.price) * item.quantity,
        });
      }
    }
    return Array.from(map.values());
  };

  const getVendorShipping = (vendorId: number) =>
    detailedOrder?.vendorShippingBreakdown?.find((vb) => vb.vendorId === vendorId);

  const vendors = groupItemsByVendor();
  const subtotal = detailedOrder?.merchandiseSubtotal != null
    ? Number(detailedOrder.merchandiseSubtotal)
    : detailedOrder?.orderItems?.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0
      ) || 0;
  const shippingFee = detailedOrder ? Number(detailedOrder.shippingFee) : 0;
  const priceBreakdown = detailedOrder?.priceBreakdown;
  const actualPrice = Number(priceBreakdown?.actualPrice ?? subtotal);
  const productDiscountTotal = Number(priceBreakdown?.productDiscountTotal ?? 0);
  const dealDiscountTotal = Number(priceBreakdown?.dealDiscountTotal ?? 0);
  const promoDiscountTotal = Number(
    priceBreakdown?.promoDiscountTotal ?? detailedOrder?.discountTotal ?? 0
  );

  const getDeliveryEstimate = () => {
    const status = (detailedOrder?.status || '').toUpperCase();
    if (status === 'DELIVERED') return 'Delivered';
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'RETURNED') return 'Returned';
    if (status === 'NOT_RECEIVED') return 'Delivery unsuccessful';
    if (status === 'ASSIGNED_TO_RIDER') return '1-2 days';
    if (status === 'ARRIVED_AT_WAREHOUSE' || status === 'PROCESSING') return '2-3 days';
    return '3-5 days';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="order-modal order-detail-modal"
        style={{ maxWidth: '700px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="order-detail__header">
          <div>
            <h2 className="order-detail__order-num">
              Order {detailedOrder?.orderNumber ? `#${detailedOrder.orderNumber}` : ''}
            </h2>
            <p className="order-detail__order-date">
              {detailedOrder?.createdAt
                ? new Date(detailedOrder.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className={`status-badge status-badge--${(detailedOrder?.status || '').toLowerCase()}`}>
              {detailedOrder?.status ? getOrderStatusMeta(detailedOrder.status).label : 'N/A'}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Est. delivery: {getDeliveryEstimate()}
            </span>
          </div>
        </div>

        <div className="order-modal__content">
          {isLoading ? (
            <div className="order-modal__loading">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ width: `${60 + i * 8}%`, height: 18, marginBottom: 10, borderRadius: 4 }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="order-modal__error">
              <p>{error}</p>
            </div>
          ) : detailedOrder ? (
            <>
              {/* Items grouped by vendor */}
              <div className="order-section">
                <h3 className="order-section__title">Items</h3>
                {vendors.map(vendor => {
                  const vendorShipping = getVendorShipping(vendor.vendorId);
                  const same = vendorShipping ? vendorShipping.shippingZone === 'SAME_DISTRICT' : null;
                  return (
                    <div key={vendor.vendorId} className="vendor-card">
                      <div className="vendor-card__header">
                        <div>
                          <h4 className="vendor-card__name">{vendor.vendorName}</h4>
                          {vendor.vendorDistrict && (
                            <span className="vendor-card__district">
                              {same === null ? '' : same ? 'Same District' : 'Cross District'} — {vendor.vendorDistrict}
                            </span>
                          )}
                        </div>
                        {vendorShipping && (
                          <span className={`vendor-card__shipping-badge ${same ? 'vendor-card__shipping-badge--same' : 'vendor-card__shipping-badge--cross'}`}>
                            Shipping: Rs. {vendorShipping.shippingFee.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="vendor-card__items">
                        {vendor.items.map(item => {
                          const img = item.imageSnapshot || item.product?.productImages?.[0] || item.variant?.variantImages?.[0];
                          const name = item.productNameSnapshot || item.product?.name || 'Unknown Product';
                          const sku = item.skuSnapshot || item.variant?.sku;
                          const attrs = item.variant?.attributes;
                          const itemPriceBreakdown = item.priceBreakdown;
                          const hasLineSavings = Number(itemPriceBreakdown?.savingsTotal ?? 0) > 0;
                          return (
                            <div key={item.id} className="vendor-card__item">
                              <img
                                src={img || defaultProductImage}
                                alt={name}
                                className="vendor-card__item-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    defaultProductImage as string;
                                }}
                              />
                              <div className="vendor-card__item-details">
                                <p className="vendor-card__item-name">{name}</p>
                                <div className="vendor-card__item-meta">
                                  <span>Qty: {item.quantity}</span>
                                  {sku && <span>SKU: {sku}</span>}
                                </div>
                                {attrs && Object.keys(attrs).length > 0 && (
                                  <div className="vendor-card__variant-attrs">
                                    {Object.entries(attrs).map(([key, val]) => (
                                      <span key={key} className="vendor-card__variant-tag">
                                        {key}: {val}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {hasLineSavings && (
                                  <div className="vendor-card__price-breakdown">
                                    {Number(itemPriceBreakdown?.productDiscount.amount ?? 0) > 0 && (
                                      <span className="vendor-card__price-pill vendor-card__price-pill--discount">
                                        Discount: -Rs. {Number(itemPriceBreakdown?.productDiscount.amount ?? 0).toFixed(2)}
                                      </span>
                                    )}
                                    {Number(itemPriceBreakdown?.dealDiscount.amount ?? 0) > 0 && (
                                      <span className="vendor-card__price-pill vendor-card__price-pill--deal">
                                        Deal{itemPriceBreakdown?.dealDiscount.label ? `: ${itemPriceBreakdown.dealDiscount.label}` : ''}: -Rs. {Number(itemPriceBreakdown?.dealDiscount.amount ?? 0).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="vendor-card__item-pricing">
                                <span className="vendor-card__item-total">
                                  Rs. {(Number(item.price) * item.quantity).toFixed(2)}
                                </span>
                                <span className="vendor-card__item-unit">
                                  Rs. {Number(item.price).toFixed(2)} x {item.quantity}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="vendor-card__footer">
                        <div className="vendor-card__footer-left">
                          <span className="vendor-card__footer-label">Shipping</span>
                          <span className="vendor-card__footer-shipping">
                            {vendorShipping
                              ? `Rs. ${vendorShipping.shippingFee.toFixed(2)} (${same ? 'Same District' : 'Cross District'})`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="vendor-card__footer-right">
                          <span className="vendor-card__footer-label">Items subtotal</span>
                          <span className="vendor-card__footer-subtotal">Rs. {vendor.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shipping Address */}
              <div className="order-section">
                <h3 className="order-section__title">Shipping Address</h3>
                <div className="order-info-grid">
                  <div className="order-info-grid__item order-info-grid__item--full">
                    <span className="order-info-grid__value">
                      {formatAddress(detailedOrder.shippingAddress)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="order-section">
                <h3 className="order-section__title">Order Summary</h3>
                <div className="order-summary-box">
                  <div className="order-summary-row">
                    <span className="order-summary-row__label">Actual price</span>
                    <span className="order-summary-row__value">Rs. {actualPrice.toFixed(2)}</span>
                  </div>
                  {productDiscountTotal > 0 && (
                    <div className="order-summary-row order-summary-row--savings">
                      <span className="order-summary-row__label">Product discount</span>
                      <span className="order-summary-row__value">- Rs. {productDiscountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {dealDiscountTotal > 0 && (
                    <div className="order-summary-row order-summary-row--savings">
                      <span className="order-summary-row__label">Deals</span>
                      <span className="order-summary-row__value">- Rs. {dealDiscountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="order-summary-row">
                    <span className="order-summary-row__label">Subtotal ({detailedOrder.orderItems?.reduce((t, i) => t + i.quantity, 0) || 0} items)</span>
                    <span className="order-summary-row__value">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {promoDiscountTotal > 0 && (
                    <div className="order-summary-row order-summary-row--savings">
                      <span className="order-summary-row__label">
                        Promo{priceBreakdown?.appliedPromoCode ? ` (${priceBreakdown.appliedPromoCode})` : ''}
                      </span>
                      <span className="order-summary-row__value">- Rs. {promoDiscountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="order-summary-row">
                    <span className="order-summary-row__label">Total shipping</span>
                    <span className="order-summary-row__value">Rs. {shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="order-summary-row order-summary-row--total">
                    <span className="order-summary-row__label">Total</span>
                    <span className="order-summary-row__value">
                      Rs. {Number(detailedOrder.totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="order-section">
                <h3 className="order-section__title">Payment</h3>
                <div className="order-info-grid">
                  <div className="order-info-grid__item">
                    <span className="order-info-grid__label">Method</span>
                    <span className="order-info-grid__value">{detailedOrder.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="order-info-grid__item">
                    <span className="order-info-grid__label">Status</span>
                    <span className={`payment-badge payment-badge--${(detailedOrder.paymentStatus || '').toLowerCase()}`}>
                      {detailedOrder.paymentStatus || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="order-modal__footer">
          <button
            className="order-modal__button order-modal__button--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetailModal;
