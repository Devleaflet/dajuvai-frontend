import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/logo.webp';
import jsPDF from 'jspdf';
import { API_BASE_URL } from "../config";
import "../Styles/PaymentNPX.css"
import { ChevronDown } from "lucide-react";  


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

  console.log("---------------------Order details----------------------")
  console.log(orderDetails)

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
            <p><strong>Amount:</strong> NPR ${charge.Amount}</p>
            <p><strong>Service Charge:</strong> NPR ${charge.TotalChargeAmount}</p>
            <p class="total"><strong>Total Amount:</strong> NPR ${totalAmount}</p>
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
            <h4>Service Charge Details</h4>
            <p><strong>Amount:</strong> NPR ${amount}</p>
            <p><strong>Service Charge:</strong> NPR ${mockCharge}</p>
            <p class="total"><strong>Total Amount:</strong> NPR ${totalAmount}</p>
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
    } catch (error: unknown) {
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

  // PDF download function
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
      } catch (e) {
        console.log(e)
      }
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
        <div className="logo-header">
          <img src={logo} alt="Company Logo" />
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
                <div className="npx-form-group">
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
                    placeholder="NPR 0.00"
                  />
                </div>


                <div className="form-group select-wrapper">
                  <label htmlFor="instrumentCode">Select Payment Method</label>
                  <div className="select-container">
                    <select
                      id="instrumentCode"
                      name="instrumentCode"
                      value={instrumentCode}
                      onChange={(e) => setInstrumentCode(e.target.value)}
                      required
                      className="form-input select-input"
                      disabled={paymentInstruments.length === 0}
                    >
                      <option value="" disabled hidden>
                        {paymentInstruments.length > 0 
                          ? "Choose your preferred payment method..." 
                          : "No banks available"}
                      </option>
                      {paymentInstruments.length > 0 ? (
                        paymentInstruments.map((instrument) => (
                          <option key={instrument.InstrumentCode} value={instrument.InstrumentCode}>
                            {instrument.InstitutionName} - {instrument.InstrumentName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No payment methods available
                        </option>
                      )}
                    </select>
                    <ChevronDown className="select-icon" size={20} />
                  </div>
                </div>


                <div className="form-group">
                  <label htmlFor="remarks">Transaction Notes (Optional)</label>
                  <input
                    type="text"
                    id="remarks"
                    name="remarks"
                    placeholder="Add a note for this payment..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="form-input"
                    maxLength={100}
                  />
                </div>

                {serviceCharge && (
                  <div className="service-charge" dangerouslySetInnerHTML={{ __html: serviceCharge }} />
                )}

                <button
                  type="submit"
                  className="pay-button"
                  disabled={isLoading || !instrumentCode}
                >
                  <span>🔒</span>
                  <span>Pay Securely</span>
                </button>
              </form>
            ) : (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Processing your payment...</p>
                <p className="loading-subtext">Please wait while we redirect you to the payment gateway</p>
              </div>
            )}
          </div>
        ) : (
          // Payment Status Section
          <div className="payment-card">
            <h1 className="status-header">Payment Status</h1>
            {renderTransactionStatus()}
            
            {transactionStatus && transactionStatus.code === '0' && (
              <button 
                onClick={handleDownloadPDF} 
                className="pay-button download-bill-btn"
              >
                <span>📄</span>
                <span>Download Bill (PDF)</span>
              </button>
            )}
            
            <button
              onClick={() => window.location.href = '/'}
              className="pay-button return-home"
            >
              <span>🏠</span>
              <span>Return to Home</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NepalPaymentGateway;