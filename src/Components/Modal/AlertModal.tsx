// import React from 'react';
// import './AlertModal.css';

// interface AlertModalProps {
//   open: boolean;
//   message: string;
//   onClose: () => void;
//   buttons?: {
//     label: string;
//     action: () => void;
//     style?: React.CSSProperties;
//   }[];
// }

// const AlertModal: React.FC<AlertModalProps> = ({ open, message, onClose }) => {
//   if (!open) return null;
//   return (
//     <div className="alert-modal-backdrop">
//       <div className="alert-modal">
//         <div className="alert-modal-content">
//           <span className="alert-modal-message">{message}</span>
//           <button className="alert-modal-close" onClick={onClose}>
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AlertModal; 



// src/Components/Modal/AlertModal.tsx
import React from 'react';
import './AlertModal.css'; // Add corresponding styles

interface AlertModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
  buttons?: {
    label: string;
    action: () => void;
    style?: React.CSSProperties;
  }[];
}

const AlertModal: React.FC<AlertModalProps> = ({ open, message, onClose, buttons }) => {
  if (!open) return null;

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal">
        <p className="alert-modal-message">{message}</p>
        <div className="alert-modal-buttons">
          {buttons ? (
            buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                style={button.style}
                className="alert-modal-button"
              >
                {button.label}
              </button>
            ))
          ) : (
            <button onClick={onClose} className="alert-modal-button">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;