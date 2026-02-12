import React from "react";
import "../../Styles/VendorViewModal.css";
import { Vendor } from "../Types/vendor";

interface VendorViewModalProps {
  show: boolean;
  onClose: () => void;
  vendor: Vendor | null;
}

const VendorViewModal: React.FC<VendorViewModalProps> = ({
  show,
  onClose,
  vendor,
}) => {
  if (!show || !vendor) return null;

  const renderDetailItem = (
    label: string,
    value: React.ReactNode
  ) => {
    return (
      <div className="detail-item">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value || "N/A"}</span>
      </div>
    );
  };

  const renderDocumentSection = (
    title: string,
    documents: string[] | null
  ) => {
    if (!documents || documents.length === 0) {
      return (
        <div className="document-section">
          <h3>{title}</h3>
          <span className="na-text">No documents available</span>
        </div>
      );
    }

    return (
      <div className="document-section">
        <h3>{title}</h3>
        <div className="document-container">
          {documents.map((url, index) => (
            <div key={index} className="document-item">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="document-link"
              >
                <img
                  src={url}
                  alt={`${title} ${index + 1}`}
                  className="document-image"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23e5e7eb"/><text x="60" y="60" text-anchor="middle" dy=".35em" fill="%236b7280" font-size="12">No Image</text></svg>';
                  }}
                />
                <div className="document-overlay">View</div>
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPaymentOptions = () => {
    if (!vendor.paymentOptions || vendor.paymentOptions.length === 0) {
      return (
        <div className="payment-section">
          <h3>Payment Options</h3>
          <span className="na-text">No payment options available</span>
        </div>
      );
    }

    return (
      <div className="payment-section">
        <h3>Payment Options</h3>
        <div className="payment-options-container">
          {vendor.paymentOptions.map((option, index) => (
            <div key={option.id || index} className="payment-option-card">
              <div className="payment-header">
                <h4>{option.paymentType}</h4>
                <span className={`payment-status ${option.isActive ? 'active' : 'inactive'}`}>
                  {option.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="payment-details">
                {option.paymentType === 'BANK' ? (
                  <>
                    {option.details.bankName && (
                      <div className="payment-detail-item">
                        <span className="payment-label">Bank Name:</span>
                        <span className="payment-value">{option.details.bankName}</span>
                      </div>
                    )}
                    {option.details.accountNumber && (
                      <div className="payment-detail-item">
                        <span className="payment-label">Account Number:</span>
                        <span className="payment-value">{option.details.accountNumber}</span>
                      </div>
                    )}
                    {option.details.accountName && (
                      <div className="payment-detail-item">
                        <span className="payment-label">Account Name:</span>
                        <span className="payment-value">{option.details.accountName}</span>
                      </div>
                    )}
                    {option.details.branch && (
                      <div className="payment-detail-item">
                        <span className="payment-label">Branch:</span>
                        <span className="payment-value">{option.details.branch}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {option.details.walletNumber && (
                      <div className="payment-detail-item">
                        <span className="payment-label">Wallet Number:</span>
                        <span className="payment-value">{option.details.walletNumber}</span>
                      </div>
                    )}
                    {option.details.accountName && (
                      <div className="payment-detail-item">
                        <span className="payment-label">Account Name:</span>
                        <span className="payment-value">{option.details.accountName}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {option.qrCodeImage && (
                <div className="qr-code-section">
                  <span className="qr-label">QR Code:</span>
                  <img
                    src={option.qrCodeImage}
                    alt={`${option.paymentType} QR Code`}
                    className="qr-code-image"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23e5e7eb"/><text x="60" y="60" text-anchor="middle" dy=".35em" fill="%236b7280" font-size="12">No QR</text></svg>';
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Vendor Details</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="vendor-view-vendor-details">
          {/* Basic Info */}
          <div className="detail-grid">
            {renderDetailItem("Vendor ID", vendor.id)}
            {renderDetailItem("Business Name", vendor.businessName)}
            {renderDetailItem("Email", vendor.email)}
            {renderDetailItem("Phone Number", vendor.phoneNumber)}
            {renderDetailItem("Telephone", vendor.telePhone)}
            {renderDetailItem("District", vendor.district?.name)}
            {renderDetailItem(
              "Verified",
              vendor.isVerified ? (
                <span className="status-badge active">Yes</span>
              ) : (
                <span className="status-badge inactive">No</span>
              )
            )}
            {renderDetailItem(
              "Approved",
              vendor.isApproved ? (
                <span className="status-badge active">Yes</span>
              ) : (
                <span className="status-badge inactive">No</span>
              )
            )}
          </div>

          {/* Business Info */}
          <div className="detail-grid">
            {renderDetailItem("Business Registration No.", vendor.businessRegNumber)}
            {renderDetailItem("Tax Number (PAN)", vendor.taxNumber)}
          </div>

          {/* Documents */}
          {renderDocumentSection(
            "Tax Documents",
            vendor.taxDocuments
          )}
          {renderDocumentSection(
            "Citizenship Documents",
            vendor.citizenshipDocuments
          )}

          {/* Payment Options */}
          {renderPaymentOptions()}
        </div>
      </div>
    </div>
  );
};

export default VendorViewModal;
