
import React from "react";
import "../../Styles/DeleteModal.css";

interface DeleteModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: () => void;
  productName: string;
  isLoading?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  onClose,
  onDelete,
  productName,
  isLoading = false,
}) => {
  if (!show) return null;

  return (
    <div className="delete-modal">
      <div
        className="delete-modal__overlay"
        onClick={isLoading ? undefined : onClose}
      />
      <div className="delete-modal__content">
        <div className="delete-modal__icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="delete-modal__title">Delete Product</h3>
        <p className="delete-modal__message">
          Are you sure you want to delete{" "}
          <strong className="delete-modal__product-name">"{productName}"</strong>?
          <br />
          This will permanently remove the product and all its images. This action cannot be undone.
        </p>
        <div className="delete-modal__actions">
          <button
            className="delete-modal__cancel-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="delete-modal__delete-btn"
            onClick={onDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="delete-modal__spinner" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;