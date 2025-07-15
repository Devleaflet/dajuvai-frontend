import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface VendorVerifyModalProps {
  show: boolean;
  onClose: () => void;
  email: string;
}

const VendorVerifyModal: React.FC<VendorVerifyModalProps> = ({ show, onClose, email }) => {
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<'send' | 'verify'>('send');

  if (!show) return null;

  const handleSendVerification = async () => {
    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Verification token sent!');
        setStep('verify');
      } else {
        toast.error(data.message || (data.errors ? data.errors.map((e:any)=>e.message).join('; ') : 'Failed to send verification.'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, token: otp })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Vendor verified successfully!');
        onClose();
      } else {
        toast.error(data.message || (data.errors ? data.errors.map((e:any)=>e.message).join('; ') : 'Failed to verify OTP.'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/verify/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || 'Verification token resent!');
      } else {
        toast.error(data.message || (data.errors ? data.errors.map((e:any)=>e.message).join('; ') : 'Failed to resend verification.'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay add-vendor-modal-overlay">
      <div className="modal-content add-vendor-modal-content">
        <div className="modal-header add-vendor-modal-header">
          <h3 className="add-vendor-title">Verify Vendor Email</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div style={{ marginBottom: 18, color: '#555' }}>
          <b>Email:</b> {email}
        </div>
        {step === 'send' && (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSendVerification} disabled={sending}>
            {sending ? 'Sending...' : 'Send Verification Email'}
          </button>
        )}
        {step === 'verify' && (
          <form onSubmit={e => { e.preventDefault(); handleVerifyOtp(); }}>
            <div className="form-group">
              <label>Enter OTP (6-digit code sent to email)</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                minLength={6}
                pattern="[0-9]{6}"
                required
                style={{ letterSpacing: 4, fontSize: 20, textAlign: 'center' }}
                autoFocus
              />
            </div>
            <div className="add-vendor-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={verifying}>
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" className="btn btn-link" style={{ color: '#ff9800', marginTop: 8 }} onClick={handleResendOtp} disabled={sending}>
                {sending ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VendorVerifyModal; 