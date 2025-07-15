import React, { useState } from 'react';

interface BulkCreditModalProps {
  show: boolean;
  onClose: () => void;
  onApply: (creditAmount: number) => void;
  selectedCount: number;
}

const BulkCreditModal: React.FC<BulkCreditModalProps> = ({
  show,
  onClose,
  onApply,
  selectedCount
}) => {
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditType, setCreditType] = useState<'fixed' | 'percentage'>('fixed');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creditAmount <= 0) {
      setErrorMessage('Credit amount must be greater than 0');
      return;
    }
    
    // Apply the credit as a fixed amount
    onApply(creditAmount);
    
    // Reset form
    setCreditAmount(0);
    setCreditType('fixed');
    setExpiryDate('');
    setErrorMessage('');
  };

  const handleCreditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCreditAmount(isNaN(value) ? 0 : value);
    
    if (creditType === 'percentage' && value > 100) {
      setErrorMessage('Percentage cannot exceed 100%');
    } else {
      setErrorMessage('');
    }
  };

  return (
    <div className="vendor-product__modal-overlay">
      <div className="vendor-product__modal bulk-credit-modal">
        <div className="vendor-product__modal-header">
          <h2>Add Bulk Credit</h2>
          <button className="vendor-product__modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="vendor-product__modal-body">
            <div className="vendor-product__form-info">
              You are adding credit to <strong>{selectedCount}</strong> selected product(s).
            </div>
            
            <div className="vendor-product__form-group">
              <label>Credit Type</label>
              <div className="vendor-product__radio-group">
                <label className="vendor-product__radio-label">
                  <input 
                    type="radio" 
                    name="creditType" 
                    value="fixed" 
                    checked={creditType === 'fixed'} 
                    onChange={() => setCreditType('fixed')} 
                  />
                  Fixed Amount
                </label>
                <label className="vendor-product__radio-label">
                  <input 
                    type="radio" 
                    name="creditType" 
                    value="percentage" 
                    checked={creditType === 'percentage'} 
                    onChange={() => setCreditType('percentage')} 
                  />
                  Percentage of Price
                </label>
              </div>
            </div>
            
            <div className="vendor-product__form-group">
              <label>
                {creditType === 'fixed' ? 'Credit Amount ($)' : 'Credit Percentage (%)'}
              </label>
              <input 
                type="number" 
                min="0"
                max={creditType === 'percentage' ? '100' : undefined}
                step="0.01"
                value={creditAmount || ''}
                onChange={handleCreditAmountChange}
                required
              />
              {errorMessage && (
                <div className="vendor-product__form-error">{errorMessage}</div>
              )}
            </div>
            
            <div className="vendor-product__form-group">
              <label>Expiry Date (Optional)</label>
              <input 
                type="date" 
                value={expiryDate} 
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <div className="vendor-product__form-help">
                Leave blank for credits that don't expire
              </div>
            </div>
            
            <div className="vendor-product__form-group">
              <label>Additional Notes (Optional)</label>
              <textarea 
                rows={3}
                placeholder="Add any notes regarding this credit"
              />
            </div>
          </div>
          
          <div className="vendor-product__modal-footer">
            <button 
              type="button" 
              className="vendor-product__modal-btn vendor-product__modal-cancel" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="vendor-product__modal-btn vendor-product__modal-save"
              disabled={creditAmount <= 0 || (creditType === 'percentage' && creditAmount > 100)}
            >
              Apply Credit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkCreditModal;