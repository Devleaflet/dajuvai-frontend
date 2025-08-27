import React from 'react';
import Modal from './Modal';
import '../../Styles/OrderTrackingModal.css';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingResult: {
    success: boolean;
    orderStatus?: string;
    message?: string;
  } | null;
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose, trackingResult }) => {

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#ffa500';
      case 'CONFIRMED':
        return '#007bff';
      case 'SHIPPED':
        return '#17a2b8';
      case 'DELIVERED':
        return '#28a745';
      case 'CANCELLED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '⏳';
      case 'CONFIRMED':
        return '✅';
      case 'SHIPPED':
        return '🚚';
      case 'DELIVERED':
        return '📦';
      case 'CANCELLED':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Status"
      size="medium"
    >
      <div className="order-tracking-modal">
        {trackingResult && (
          <div className="tracking-result">
            {trackingResult.success ? (
              <div className="result-success">
                <div className="status-display">
                  <span className="status-icon" style={{ color: getStatusColor(trackingResult.orderStatus!) }}>
                    {getStatusIcon(trackingResult.orderStatus!)}
                  </span>
                  <div className="status-info">
                    <h3 className="status-title">Order Status</h3>
                    <p className="status-value" style={{ color: getStatusColor(trackingResult.orderStatus!) }}>
                      {trackingResult.orderStatus}
                    </p>
                  </div>
                </div>
                <p className="status-description">
                  Your order is currently {trackingResult.orderStatus?.toLowerCase()}. 
                  {trackingResult.orderStatus?.toUpperCase() === 'DELIVERED' && 
                    ' Thank you for shopping with us!'}
                </p>
              </div>
            ) : (
              <div className="result-error">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{trackingResult.message}</p>
              </div>
            )}
          </div>
        )}

        <div className="tracking-help">
          <h4>Need Help?</h4>
          <p>If you're having trouble tracking your order, please contact our customer support:</p>
          <ul>
            <li>📧 Email: Dajuvai106@gmail.com</li>
            <li>📞 Phone: +977 - 9700620004</li>
            <li>💬 WhatsApp: Available on our website</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default OrderTrackingModal;
