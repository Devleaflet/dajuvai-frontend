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
            {renderDetailItem("District", vendor.district?.name)}
            {renderDetailItem(
              "Status",
              vendor.isVerified ? (
                <span className="status-badge active">Active</span>
              ) : (
                <span className="status-badge inactive">Inactive</span>
              )
            )}
          </div>

          {/* Business & Bank Info */}
          <div className="detail-grid">
            {renderDetailItem("PAN Number", vendor.taxNumber)}
            {renderDetailItem(
              "Business Registration No.",
              vendor.businessRegNumber
            )}
            {renderDetailItem("Account Name", vendor.accountName)}
            {renderDetailItem("Bank Name", vendor.bankName)}
            {renderDetailItem("Account Number", vendor.accountNumber)}
            {renderDetailItem("Bank Branch", vendor.bankBranch)}
            {renderDetailItem("Bank Code", vendor.bankCode)}
          </div>

          {/* Documents */}
          {renderDocumentSection(
            "PAN Documents",
            vendor.taxDocuments
          )}
          {renderDocumentSection(
            "Citizenship Documents",
            vendor.citizenshipDocuments
          )}
          {renderDocumentSection(
            "Cheque Photos",
            vendor.chequePhoto
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorViewModal;
