import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import TermsContent from '../TermsContent';
import '../../Styles/TermsModal.css';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface TermsModalProps {
	open: boolean;
	onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ open, onClose }) => {
	const panelRef = useRef<HTMLDivElement>(null);

	useBodyScrollLock(open);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleKeyDown);

		panelRef.current?.focus();

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="terms-modal-overlay"
			onClick={onClose}
		>
			<div
				className="terms-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="terms-modal-title"
				tabIndex={-1}
				ref={panelRef}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="terms-modal__header">
					<h2
						id="terms-modal-title"
						className="terms-modal__title"
					>
						Terms and Conditions
					</h2>
					<button
						type="button"
						className="terms-modal__close"
						onClick={onClose}
						aria-label="Close terms and conditions"
					>
						<FaTimes />
					</button>
				</div>

				<div className="terms-modal__body">
					<TermsContent />
				</div>

				<div className="terms-modal__footer">
					<button
						type="button"
						className="terms-modal__close-btn"
						onClick={onClose}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default TermsModal;
