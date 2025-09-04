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
// import React from 'react';
// import './AlertModal.css'; // Add corresponding styles

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

// const AlertModal: React.FC<AlertModalProps> = ({ open, message, onClose, buttons }) => {
//   if (!open) return null;

//   return (
//     <div className="alert-modal-overlay">
//       <div className="alert-modal">
//         <p className="alert-modal-message">{message}</p>
//         <div className="alert-modal-buttons">
//           {buttons ? (
//             buttons.map((button, index) => (
//               <button
//                 key={index}
//                 onClick={button.action}
//                 style={button.style}
//                 className="alert-modal-button"
//               >
//                 {button.label}
//               </button>
//             ))
//           ) : (
//             <button onClick={onClose} className="alert-modal-button">
//               Close
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AlertModal;



import React from 'react';

interface AlertModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
  buttons?: Array<{
    label: string;
    action: () => void;
    style: React.CSSProperties;
  }>;
}

const AlertModal: React.FC<AlertModalProps> = ({ open, message, onClose, buttons }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '500px', textAlign: 'center' }}>
        <p>{message}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {buttons ? (
            buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', ...button.style }}
              >
                {button.label}
              </button>
            ))
          ) : (
            <button
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', backgroundColor: '#ff6b35', color: 'white', cursor: 'pointer' }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
