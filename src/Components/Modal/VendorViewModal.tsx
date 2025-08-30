import React from "react";
import "../../Styles/VendorViewModal.css";
import { Vendor } from "../Types/vendor";

interface VendorViewModalProps {
  show: boolean;
  onClose: () => void;
  vendor: Vendor | null; // Changed from any to Vendor
}

const VendorViewModal: React.FC<VendorViewModalProps> = ({ show, onClose, vendor }) => {
  if (!show || !vendor) return null;

  const renderDetailItem = (label: string, value: any, type: string = "default") => {
    const displayValue = value || "N/A";
    const isHighlight = type === "business" || type === "email";

    return (
      <div className={`detail-item ${isHighlight ? 'highlight' : ''}`} data-type={type}>
        <p>
          <strong>{label}</strong>
          <span className="value">{displayValue}</span>
        </p>
      </div>
    );
  };

  const renderDocumentSection = (title: string, documents: string[] | string) => {
    if (!documents || (Array.isArray(documents) && documents.length === 0)) {
      return (
        <div className="document-section">
          <h3>{title}</h3>
          <span className="na-text">No documents available</span>
        </div>
      );
    }

    const documentArray = Array.isArray(documents) ? documents : [documents];

    return (
      <div className="document-section">
        <h3>{title}</h3>
        <div className="document-container">
          {documentArray.map((url: string, idx: number) => (
            <div key={idx} className="document-item">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="document-link"
                title={`View ${title} ${idx + 1}`}
              >
                <img 
                  src={url} 
                  alt={`${title} ${idx + 1}`} 
                  className="document-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">No Image</text></svg>';
                  }}
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Vendor Details</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="vendor-details">
          <div className="detail-grid">
            {renderDetailItem("ID: ", vendor.id, "id")}
            {renderDetailItem("Business Name: ", vendor.businessName, "business")}
            {renderDetailItem("Email: ", vendor.email, "email")}
            {renderDetailItem("Phone Number: ", vendor.phoneNumber, "contact")}
            {renderDetailItem("District: ", vendor.district?.name, "location")}
            {renderDetailItem("Status: ", 
              vendor.isVerified ? (
                <span className="status-badge active">Active</span>
              ) : (
                <span className="status-badge inactive">Inactive</span>
              ), "default"
            )}
          </div>

          <div className="detail-grid">
            {renderDetailItem("PAN Number: ", vendor.taxNumber, "business")}
            {renderDetailItem("Business Reg Number: ", vendor.businessRegNumber, "business")}
            {renderDetailItem("Account Name: ", vendor.accountName, "financial")}
            {renderDetailItem("Bank Name: ", vendor.bankName, "financial")}
            {renderDetailItem("Account Number: ", vendor.accountNumber, "financial")}
            {renderDetailItem("Bank Branch: ", vendor.bankBranch, "financial")}
            {renderDetailItem("Bank Code: ", vendor.bankCode, "financial")}
    
          </div>

          {renderDocumentSection("PAN Documents", vendor.taxDocuments)}
          {renderDocumentSection("Citizenship Documents", vendor.citizenshipDocuments)}
          {renderDocumentSection("Cheque Photo", vendor.chequePhoto)}
        </div>
      </div>
    </div>
  );
};

export default VendorViewModal;