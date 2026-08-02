import React from "react";
import "../../Styles/ArchiveVariantModal.css";

interface ArchiveVariantModalProps {
  show: boolean;
  sku: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ArchiveVariantModal: React.FC<ArchiveVariantModalProps> = ({
  show,
  sku,
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="archive-variant-modal" role="presentation">
      <button
        type="button"
        className="archive-variant-modal__overlay"
        aria-label="Cancel variant archive"
        onClick={onClose}
      />
      <section
        className="archive-variant-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-variant-title"
      >
        <p className="archive-variant-modal__eyebrow">Variant archive</p>
        <h3 id="archive-variant-title">Archive this variant?</h3>
        <p>
          <strong>{sku}</strong> will be removed from sale when product changes are saved.
          Order history stays intact and it can be restored later.
        </p>
        <div className="archive-variant-modal__actions">
          <button type="button" className="archive-variant-modal__cancel" onClick={onClose}>
            Keep variant
          </button>
          <button type="button" className="archive-variant-modal__confirm" onClick={onConfirm}>
            Archive variant
          </button>
        </div>
      </section>
    </div>
  );
};

export default ArchiveVariantModal;
