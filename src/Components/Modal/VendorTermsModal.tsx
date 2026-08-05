import React, { useEffect, useId, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import VendorTerms from "../../Pages/VendorTerms";
import "../../Styles/TermsModal.css";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

interface VendorTermsModalProps {
  open: boolean;
  onClose: () => void;
}

const VendorTermsModal: React.FC<VendorTermsModalProps> = ({ open, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div
        className="terms-modal terms-modal--vendor"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="terms-modal__header">
          <h2 id={titleId} className="terms-modal__title">
            Vendor Registration Agreement
          </h2>
          <button
            type="button"
            className="terms-modal__close"
            onClick={onClose}
            aria-label="Close vendor terms and conditions"
          >
            <FaTimes />
          </button>
        </div>
        <div className="terms-modal__body terms-modal__body--vendor">
          <VendorTerms embedded onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default VendorTermsModal;
