import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.webp';
import jsPDF from 'jspdf';
import { API_BASE_URL } from "../config";

// TypeScript Interfaces
interface PaymentInstrument {
  InstrumentCode: string;
  InstitutionName: string;
  InstrumentName: string;
}

interface ServiceChargeData {
  Amount: string;
  TotalChargeAmount: string;
}

interface ApiResponse<T> {
  code: string;
  data: T;
  message?: string;
}

interface PaymentInitResponse {
  success: boolean;
  merchantTxnId: string;
  paymentUrl: string;
  formData: Record<string, string>;
  error?: string;
}

interface TransactionDetails {
  MerchantTxnId: string;
  GatewayReferenceNo: string;
  Amount: string;
  ServiceCharge: string;
  Institution: string;
  Instrument: string;
  TransactionDate: string;
  Status: 'Success' | 'Failed' | 'Pending';
  TransactionRemarks?: string;
  CbsMessage?: string;
}

const NepalPaymentGateway: React.FC = () => {
  // State management
  const [paymentInstruments, setPaymentInstruments] = useState<PaymentInstrument[]>([]);
  const [amount, setAmount] = useState<string>('100');
  const [instrumentCode, setInstrumentCode] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [serviceCharge, setServiceCharge] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [statusMode, setStatusMode] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);

  const location = useLocation();
  const orderDetails = location.state?.orderDetails;

  if (!orderDetails) {
    return <p className="no-order-details">No order details found.</p>;
  }

  const { totalAmount, orderId } = orderDetails;

  // Initialize amount with totalAmount from order if available
  useEffect(() => {
    if (totalAmount) {
      setAmount(totalAmount.toString());
    }
  }, [totalAmount]);

  // Get URL parameters
  const getUrlParam = (name: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  };

  // Initialize component
  useEffect(() => {
    const statusParam = getUrlParam('status');
    const txnId = getUrlParam('txnId');
    
    if (statusParam || txnId) {
      setStatusMode(true);
      if (txnId) {
        checkTransactionStatus(txnId);
      } else {
        const storedTxnId = localStorage.getItem('currentTxnId');
        if (storedTxnId) {
          checkTransactionStatus(storedTxnId);
        } else {
          setError('No transaction ID found');
        }
      }
    } else {
      loadPaymentInstruments();
    }
  }, []);

  // Load payment instruments
  const loadPaymentInstruments = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/payment-instruments`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<PaymentInstrument[]> = await response.json();
      if (data.code === "0") {
        setPaymentInstruments(data.data);
      } else {
        setError('Failed to load payment methods: ' + (data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error loading payment instruments:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Cannot connect to payment server. Please check if the backend is running on port 5000.');
      } else {
        setError('Failed to load payment methods: ' + error.message);
      }
      loadMockData();
    }
  };

  // Load mock data when backend is unavailable
  const loadMockData = (): void => {
    const mockInstruments: PaymentInstrument[] = [
      { InstrumentCode: 'BANK_TRANSFER', InstitutionName: 'Test Bank', InstrumentName: 'Bank Transfer' },
      { InstrumentCode: 'MOBILE_BANKING', InstitutionName: 'Test Bank', InstrumentName: 'Mobile Banking' },
      { InstrumentCode: 'WALLET', InstitutionName: 'Test Wallet', InstrumentName: 'Digital Wallet' },
    ];
    setPaymentInstruments(mockInstruments);
    setWarning('Development Mode: Using mock payment methods. Backend server not connected.');
  };

  // Update service charge
  const updateServiceCharge = async (): Promise<void> => {
    if (!amount || !instrumentCode || parseFloat(amount) <= 0) {
      setServiceCharge('');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/service-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, instrumentCode }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<ServiceChargeData> = await response.json();
      if (data.code === "0") {
        const charge = data.data;
        const totalAmount = (parseFloat(charge.Amount) + parseFloat(charge.TotalChargeAmount)).toFixed(2);
        setServiceCharge(`
          <div class="service-charge-details">
            <h4>Service Charge Details</h4>
            <p>Amount: NPR ${charge.Amount}</p>
            <p>Service Charge: NPR ${charge.TotalChargeAmount}</p>
            <p class="total">Total: NPR ${totalAmount}</p>
          </div>
        `);
      } else {
        setServiceCharge('<p class="error-text">Unable to calculate service charge</p>');
      }
    } catch (error: any) {
      console.error('Error getting service charge:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        const mockCharge = (parseFloat(amount) * 0.02).toFixed(2);
        const totalAmount = (parseFloat(amount) + parseFloat(mockCharge)).toFixed(2);
        setServiceCharge(`
          <div class="service-charge-details">
            <h4>Service Charge Details (Mock)</h4>
            <p>Amount: NPR ${amount}</p>
            <p>Service Charge: NPR ${mockCharge}</p>
            <p class="total">Total: NPR ${totalAmount}</p>
            <p class="warning-text">⚠️ Backend not connected - showing estimated charges</p>
          </div>
        `);
      } else {
        setServiceCharge('<p class="error-text">Error calculating service charge</p>');
      }
    }
  };

  // Update service charge when amount or instrument changes
  useEffect(() => {
    updateServiceCharge();
  }, [amount, instrumentCode]);

  // Handle payment submission
  const handlePayment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!amount || !instrumentCode) {
      setError('Please fill all required fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          instrumentCode,
          transactionRemarks: remarks,
          orderId,
        }),
      });
      const data: PaymentInitResponse = await response.json();
      if (data.success) {
        localStorage.setItem('currentTxnId', data.merchantTxnId);
        submitPaymentForm(data.paymentUrl, data.formData);
      } else {
        setIsLoading(false);
        setError(data.error || 'Payment initiation failed');
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Payment error:', error);
      setError('Payment initiation failed');
    }
  };

  // Submit payment form
  const submitPaymentForm = (actionUrl: string, formData: Record<string, string>): void => {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = actionUrl;
    form.style.display = 'none';
    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  // Check transaction status
  const checkTransactionStatus = async (merchantTxnId: string): Promise<void> => {
    setStatusLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantTxnId }),
      });
      const data = await response.json();
      setTransactionStatus(data);
      setStatusLoading(false);
    } catch (error: any) {
      console.error('Error checking status:', error);
      setError('Failed to check transaction status');
      setStatusLoading(false);
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Render transaction status
  const renderTransactionStatus = () => {
    if (statusLoading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Checking payment status...</p>
        </div>
      );
    }

    if (!transactionStatus) {
      return (
        <div className="error-container">
          <h3>Error</h3>
          <p className="error-text">No transaction data available</p>
        </div>
      );
    }

    if (transactionStatus.code === "0") {
      const transaction: TransactionDetails = transactionStatus.data;
      const status = transaction.Status;
      let statusClass = 'error-container';
      let statusText = 'Failed';
      if (status === 'Success') {
        statusClass = 'success-container';
        statusText = 'Successful';
      } else if (status === 'Pending') {
        statusClass = 'warning-container';
        statusText = 'Pending';
      }

      return (
        <>
          <div className={statusClass}>
            <h3>Payment {statusText}</h3>
          </div>
          <div className="transaction-details">
            <h4>Transaction Details</h4>
            <div className="details-list">
              <p><strong>Transaction ID:</strong> {transaction.MerchantTxnId}</p>
              <p><strong>Gateway Reference:</strong> {transaction.GatewayReferenceNo}</p>
              <p><strong>Amount:</strong> NPR {transaction.Amount}</p>
              <p><strong>Service Charge:</strong> NPR {transaction.ServiceCharge}</p>
              <p><strong>Payment Method:</strong> {transaction.Institution} - {transaction.Instrument}</p>
              <p><strong>Date:</strong> {transaction.TransactionDate}</p>
              <p><strong>Status:</strong> {transaction.Status}</p>
              {transaction.TransactionRemarks && (
                <p><strong>Remarks:</strong> {transaction.TransactionRemarks}</p>
              )}
              {transaction.CbsMessage && (
                <p><strong>Message:</strong> {transaction.CbsMessage}</p>
              )}
            </div>
          </div>
        </>
      );
    } else {
      return (
        <div className="error-container">
          <h3>Transaction Not Found</h3>
          <p className="error-text">{transactionStatus.message || 'Transaction details could not be retrieved'}</p>
        </div>
      );
    }
  };

  // Add this function inside the NepalPaymentGateway component
  const handleDownloadPDF = () => {
    if (!transactionStatus || transactionStatus.code !== '0') return;
    const transaction = transactionStatus.data;
    const doc = new jsPDF();
    let y = 20;
    // Add logo (if possible and safe)
    const logoImg = document.querySelector('.logo-header img');
    if (logoImg && logoImg instanceof HTMLImageElement && logoImg.src.startsWith(window.location.origin)) {
      try {
        doc.addImage(logoImg, 'WEBP', 85, 5, 40, 16);
      } catch (e) {}
    }
    doc.setFontSize(18);
    doc.text('Payment Bill', 105, y, { align: 'center' });
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(13);
    doc.text('Transaction Details', 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Transaction ID:`, 20, y); doc.text(`${transaction.MerchantTxnId}`, 70, y);
    y += 7;
    doc.text(`Gateway Reference:`, 20, y); doc.text(`${transaction.GatewayReferenceNo}`, 70, y);
    y += 7;
    doc.text(`Date:`, 20, y); doc.text(`${transaction.TransactionDate}`, 70, y);
    y += 7;
    doc.text(`Status:`, 20, y); doc.text(`${transaction.Status}`, 70, y);
    y += 10;
    doc.setFontSize(13);
    doc.text('Payment Details', 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Amount:`, 20, y); doc.text(`NPR ${transaction.Amount}`, 70, y);
    y += 7;
    doc.text(`Service Charge:`, 20, y); doc.text(`NPR ${transaction.ServiceCharge}`, 70, y);
    y += 7;
    doc.text(`Payment Method:`, 20, y); doc.text(`${transaction.Institution} - ${transaction.Instrument}`, 70, y);
    y += 7;
    if (transaction.TransactionRemarks) { doc.text(`Remarks:`, 20, y); doc.text(`${transaction.TransactionRemarks}`, 70, y); y += 7; }
    if (transaction.CbsMessage) { doc.text(`Message:`, 20, y); doc.text(`${transaction.CbsMessage}`, 70, y); y += 7; }
    y += 5;
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, y, { align: 'center' });
    doc.save(`Payment_Bill_${transaction.MerchantTxnId}.pdf`);
  };

  return (
    <div className="main-container">
      <div className="card-container">
        <div className="logo-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src={logo} alt="Logo" style={{ width: '120px', height: 'auto', objectFit: 'contain', margin: '0 auto' }} />
        </div>
        {!statusMode ? (
          // Payment Form Section
          <div className="payment-card">
            <div className="header">
              <h1>Complete Payment</h1>
              <p>Secure and fast payment processing</p>
            </div>

            {error && (
              <div className="error-container animate-fade-in">
                <strong>Error:</strong> <span className="error-text">{error}</span>
              </div>
            )}

            {warning && (
              <div className="warning-container animate-fade-in">
                <strong>Development Mode:</strong> <span className="warning-text">{warning}</span>
              </div>
            )}

            {!isLoading ? (
              <form onSubmit={handlePayment} className="payment-form">
                <div className="form-group">
                  <label htmlFor="amount">Amount (NPR)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    readOnly
                    className="form-input readonly"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="instrumentCode">Payment Method</label>
                  <select
                    id="instrumentCode"
                    name="instrumentCode"
                    value={instrumentCode}
                    onChange={(e) => setInstrumentCode(e.target.value)}
                    required
                    className="form-input"
                  >
                    <option value="">Choose your payment method...</option>
                    {paymentInstruments.map((instrument) => (
                      <option key={instrument.InstrumentCode} value={instrument.InstrumentCode}>
                        {instrument.InstitutionName} - {instrument.InstrumentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="remarks">Transaction Notes</label>
                  <input
                    type="text"
                    id="remarks"
                    name="remarks"
                    placeholder="Add a note for this transaction (optional)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="form-input"
                  />
                </div>

                {serviceCharge && (
                  <div className="service-charge" dangerouslySetInnerHTML={{ __html: serviceCharge }} />
                )}

                <button
                  type="submit"
                  className="pay-button"
                  disabled={isLoading}
                >
                  🔒 Pay Securely
                </button>
              </form>
            ) : (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Processing your payment...</p>
                <p className="loading-subtext">Please wait while we redirect you</p>
              </div>
            )}
          </div>
        ) : (
          // Payment Status Section
          <div className="payment-card">
            <h1 className="status-header">Payment Status</h1>
            {renderTransactionStatus()}
            {transactionStatus && transactionStatus.code === '0' && (
              <button onClick={handleDownloadPDF} className="pay-button download-bill-btn" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span role="img" aria-label="download">📄</span> Download Bill (PDF)
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="pay-button return-home"
            >
              🏠 Return Home
            </button>
          </div>
        )}
      </div>
      <style>
        {`
          /* Global Styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          /* Main Container */
          .main-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #ffffff 0%, #ff6d00 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }

          /* Card Container */
          .card-container {
            max-width: 28rem;
            width: 100%;
          }

          /* Logo Header */
          .logo-header {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .logo-header img {
            width: 120px;
            height: auto;
            object-fit: contain;
            margin: 0 auto;
          }

          /* Payment Card */
          .payment-card {
            background: #ffffff;
            border-radius: 1rem;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
            padding: 2rem;
            transition: all 0.3s ease;
          }
          .payment-card:hover {
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
          }

          /* Header */
          .header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .header h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1f2937;
          }
          .header p {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.5rem;
          }

          /* Status Header */
          .status-header {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1f2937;
            text-align: center;
            margin-bottom: 2rem;
          }

          /* Form Styles */
          .payment-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .form-group {
            display: flex;
            flex-direction: column;
          }
          .form-group label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: #374151;
            transition: all 0.2s ease;
          }
          .form-input:focus {
            outline: none;
            border-color: #ff9800;
            box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
          }
          .form-input.readonly {
            background-color: #f3f4f6;
            color: #6b7280;
            cursor: not-allowed;
          }
          .form-input::placeholder {
            color: #9ca3af;
          }

          /* Service Charge */
          .service-charge {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 0.5rem;
            border-left: 4px solid #ff9800;
            margin-bottom: 1.5rem;
          }
          .service-charge-details h4 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          .service-charge-details p {
            font-size: 0.875rem;
            color: #4b5563;
            margin: 0.25rem 0;
          }
          .service-charge-details .total {
            font-weight: 700;
            color: #1f2937;
          }
          .service-charge-details .warning-text {
            font-size: 0.75rem;
            color: #d97706;
          }
          .service-charge .error-text {
            font-size: 0.875rem;
            color: #dc2626;
          }

          /* Buttons */
          .pay-button {
            width: 100%;
            padding: 0.75rem;
            background: linear-gradient(to right, #ff9800, #ff6d00);
            color: #ffffff;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .pay-button:hover {
            background: linear-gradient(to right, #fb8c00, #f57c00);
            transform: translateY(-2px);
          }
          .pay-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .return-home {
            margin-top: 1.5rem;
          }

          /* Loading */
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .spinner {
            width: 3rem;
            height: 3rem;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #ff9800;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            font-size: 1rem;
            font-weight: 500;
            color: #374151;
            margin-top: 1rem;
          }
          .loading-subtext {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.25rem;
          }

          /* Status Containers */
          .error-container {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
          }
          .success-container {
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
          }
          .warning-container {
            background: #fefce8;
            border-left: 4px solid #facc15;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
          }
          .error-container h3,
          .success-container h3,
          .warning-container h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .error-container h3 { color: #dc2626; }
          .success-container h3 { color: #22c55e; }
          .warning-container h3 { color: #d97706; }
          .error-text { color: #dc2626; }
          .warning-text { color: #d97706; }

          /* Transaction Details */
          .transaction-details {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
          }
          .transaction-details h4 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1rem;
          }
          .details-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .details-list p {
            font-size: 0.875rem;
            color: #4b5563;
          }
          .details-list p strong {
            font-weight: 600;
            color: #1f2937;
          }

          /* No Order Details */
          .no-order-details {
            text-align: center;
            font-size: 1.125rem;
            color: #4b5563;
            padding: 2rem;
          }

          /* Animations */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }

          /* Download Bill Button */
          .download-bill-btn {
            background: linear-gradient(to right, #ff9800, #ffb300);
            color: #fff;
            font-weight: 700;
            border: 2px solid #ff9800;
            box-shadow: 0 2px 8px rgba(255, 152, 0, 0.08);
            margin-bottom: 0.5rem;
          }
          .download-bill-btn:hover {
            background: linear-gradient(to right, #fb8c00, #ffa726);
            border-color: #fb8c00;
          }
        `}
      </style>
    </div>
  );
};

export default NepalPaymentGateway;