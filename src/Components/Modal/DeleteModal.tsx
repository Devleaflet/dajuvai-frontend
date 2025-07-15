
import React from "react";
import "../../Styles/DeleteModal.css";

interface DeleteModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: () => void;
  productName: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  onClose,
  onDelete,
  productName,
}) => {
  if (!show) return null;

  return (
    <div className="delete-modal">
      <div className="delete-modal__overlay" onClick={onClose}></div>
      <div className="delete-modal__content">
        <h3 className="delete-modal__title">Confirm Deletion</h3>
        <p className="delete-modal__message">
          Are you sure you want to delete <strong>{productName}</strong>? This action cannot be undone.
        </p>
        <div className="delete-modal__actions">
          <button
            className="delete-modal__cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="delete-modal__delete-btn"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;