import React from 'react';
import './AlertModal.css';

interface AlertModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="alert-modal-backdrop">
      <div className="alert-modal">
        <div className="alert-modal-content">
          <span className="alert-modal-message">{message}</span>
          <button className="alert-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal; 