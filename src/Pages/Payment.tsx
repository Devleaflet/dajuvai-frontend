import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/logo.webp";
import jsPDF from "jspdf";
import { API_BASE_URL } from "../config";
import "../Styles/PaymentNPX.css";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileDown,
  Home,
  Landmark,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

// TypeScript Interfaces
interface PaymentInstrument {
  InstrumentCode: string;
  InstitutionName: string;
  InstrumentName: string;
  LogoUrl?: string | null;
}

interface ServiceChargeData {
  Amount: string;
  TotalChargeAmount: string;
}

interface ChargeSummary {
  amount: string;
  fee: string;
  total: string;
  estimated?: boolean;
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
  Status: "Success" | "Failed" | "Pending";
  TransactionRemarks?: string;
  CbsMessage?: string;
}

type InstrumentGroup =
  | "Wallets & Digital Payments"
  | "Card Payments"
  | "Banks & Financial Institutions";

const GROUP_ORDER: InstrumentGroup[] = [
  "Wallets & Digital Payments",
  "Card Payments",
  "Banks & Financial Institutions",
];

const GROUP_ICONS: Record<InstrumentGroup, React.ReactNode> = {
  "Wallets & Digital Payments": <Wallet size={14} />,
  "Card Payments": <CreditCard size={14} />,
  "Banks & Financial Institutions": <Landmark size={14} />,
};

const categorizeInstrument = (
  instrument: PaymentInstrument,
): InstrumentGroup => {
  const name =
    `${instrument.InstitutionName} ${instrument.InstrumentName}`.toLowerCase();
  if (name.includes("card")) return "Card Payments";
  if (/(bank|bikas|finance)/.test(name))
    return "Banks & Financial Institutions";
  return "Wallets & Digital Payments";
};

// "Card Payment - Card Payment" style duplication → single clean label
const instrumentLabel = (instrument: PaymentInstrument): string =>
  instrument.InstitutionName === instrument.InstrumentName
    ? instrument.InstitutionName
    : `${instrument.InstitutionName} · ${instrument.InstrumentName}`;

/** Provider logo with graceful monogram fallback. */
const InstrumentLogo: React.FC<{ instrument: PaymentInstrument }> = ({
  instrument,
}) => {
  const [failed, setFailed] = useState(false);
  if (!instrument.LogoUrl || failed) {
    return (
      <span className="pm-logo pm-logo--fallback" aria-hidden="true">
        {instrument.InstitutionName.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="pm-logo"
      src={instrument.LogoUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const NepalPaymentGateway: React.FC = () => {
  // State management
  const [paymentInstruments, setPaymentInstruments] = useState<
    PaymentInstrument[]
  >([]);
  const [amount, setAmount] = useState<string>("100");
  const [instrumentCode, setInstrumentCode] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [charge, setCharge] = useState<ChargeSummary | null>(null);
  const [chargeError, setChargeError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [warning, setWarning] = useState<string>("");
  const [statusMode, setStatusMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("status") || params.get("txnId"));
  });
  const [transactionStatus, setTransactionStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const orderDetails = location.state?.orderDetails;
  const totalAmount = orderDetails?.totalAmount;
  const orderId = orderDetails?.orderId;
  const draftId = orderDetails?.draftId;
  const orderNumber = orderDetails?.orderNumber;

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
    const statusParam = getUrlParam("status");
    const txnId = getUrlParam("txnId");

    if (statusParam || txnId) {
      setStatusMode(true);
      if (txnId) {
        checkTransactionStatus(txnId);
      } else {
        const storedTxnId = localStorage.getItem("currentTxnId");
        if (storedTxnId) {
          checkTransactionStatus(storedTxnId);
        } else {
          setError("No transaction ID found");
        }
      }
    } else {
      loadPaymentInstruments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the payment-method dropdown on outside click / Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdownOpen]);

  // Focus the search box when the dropdown opens
  useEffect(() => {
    if (dropdownOpen) searchRef.current?.focus();
  }, [dropdownOpen]);

  // Load payment instruments
  const loadPaymentInstruments = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payments/payment-instruments`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<PaymentInstrument[]> = await response.json();
      if (data.code === "0") {
        setPaymentInstruments(data.data);
      } else {
        setError(
          "Failed to load payment methods: " +
            (data.message || "Unknown error"),
        );
      }
    } catch (error: any) {
      console.error("Error loading payment instruments:", error);
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        setError(
          "Cannot connect to the payment server. Please try again in a moment.",
        );
      } else {
        setError("Failed to load payment methods: " + error.message);
      }
      loadMockData();
    }
  };

  // Load mock data when backend is unavailable
  const loadMockData = (): void => {
    const mockInstruments: PaymentInstrument[] = [
      {
        InstrumentCode: "BANK_TRANSFER",
        InstitutionName: "Test Bank",
        InstrumentName: "Bank Transfer",
        LogoUrl: null,
      },
      {
        InstrumentCode: "MOBILE_BANKING",
        InstitutionName: "Test Bank",
        InstrumentName: "Mobile Banking",
        LogoUrl: null,
      },
      {
        InstrumentCode: "WALLET",
        InstitutionName: "Test Wallet",
        InstrumentName: "Digital Wallet",
        LogoUrl: null,
      },
    ];
    setPaymentInstruments(mockInstruments);
    setWarning(
      "Development Mode: Using mock payment methods. Backend server not connected.",
    );
  };

  // Update service charge
  const updateServiceCharge = async (): Promise<void> => {
    if (!amount || !instrumentCode || parseFloat(amount) <= 0) {
      setCharge(null);
      setChargeError("");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payments/service-charge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, instrumentCode }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<ServiceChargeData> = await response.json();
      if (data.code === "0") {
        const chargeData = data.data;
        const total = (
          parseFloat(chargeData.Amount) +
          parseFloat(chargeData.TotalChargeAmount)
        ).toFixed(2);
        setCharge({
          amount: parseFloat(chargeData.Amount).toFixed(2),
          fee: parseFloat(chargeData.TotalChargeAmount).toFixed(2),
          total,
        });
        setChargeError("");
      } else {
        setCharge(null);
        setChargeError("Unable to calculate service charge");
      }
    } catch (error: any) {
      console.error("Error getting service charge:", error);
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        const mockCharge = (parseFloat(amount) * 0.02).toFixed(2);
        const total = (parseFloat(amount) + parseFloat(mockCharge)).toFixed(2);
        setCharge({
          amount: parseFloat(amount).toFixed(2),
          fee: mockCharge,
          total,
          estimated: true,
        });
        setChargeError("");
      } else {
        setCharge(null);
        setChargeError("Error calculating service charge");
      }
    }
  };

  // Update service charge when amount or instrument changes
  useEffect(() => {
    updateServiceCharge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, instrumentCode]);

  const handlePayment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Guard against double submission (e.g. rapid Enter presses)
    if (isLoading) return;

    if (!amount || !instrumentCode) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payments/initiate-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Preserve paisa: parseInt used to silently truncate 1400.50 → 1400
            amount: Number(parseFloat(amount).toFixed(2)),
            instrumentCode,
            transactionRemarks: remarks,
            // Draft-based checkout: the order only exists after the gateway
            // confirms success, so initiate against the draft when present.
            ...(draftId ? { draftId } : { orderId }),
          }),
        },
      );

      const data: PaymentInitResponse = await response.json();

      if (data.success) {
        localStorage.setItem("currentTxnId", data.merchantTxnId);
        submitPaymentForm(data.paymentUrl, data.formData);
      } else {
        setIsLoading(false);
        setError(data.error || "Payment initiation failed");
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Payment error:", error);
      setError("Payment initiation failed");
    }
  };

  // Submit payment form
  const submitPaymentForm = (
    actionUrl: string,
    formData: Record<string, string>,
  ): void => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = actionUrl;
    form.style.display = "none";
    Object.keys(formData).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  // Check transaction status
  const checkTransactionStatus = async (
    merchantTxnId: string,
  ): Promise<void> => {
    setStatusLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payments/check-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantTxnId }),
        },
      );
      const data = await response.json();
      setTransactionStatus(data);
      setStatusLoading(false);
    } catch (error: unknown) {
      console.error("Error checking status:", error);
      setError("Failed to check transaction status");
      setStatusLoading(false);
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const selectedInstrument = useMemo(
    () =>
      paymentInstruments.find((i) => i.InstrumentCode === instrumentCode) ??
      null,
    [paymentInstruments, instrumentCode],
  );

  const groupedInstruments = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? paymentInstruments.filter((i) =>
          instrumentLabel(i).toLowerCase().includes(query),
        )
      : paymentInstruments;
    const groups = new Map<InstrumentGroup, PaymentInstrument[]>();
    for (const group of GROUP_ORDER) groups.set(group, []);
    for (const instrument of filtered) {
      groups.get(categorizeInstrument(instrument))!.push(instrument);
    }
    return GROUP_ORDER.filter(
      (group) => (groups.get(group) ?? []).length > 0,
    ).map((group) => ({ group, items: groups.get(group)! }));
  }, [paymentInstruments, search]);

  const selectInstrument = (code: string) => {
    setInstrumentCode(code);
    setDropdownOpen(false);
    setSearch("");
  };

  // Render transaction status
  const renderTransactionStatus = () => {
    if (statusLoading) {
      return (
        <div className="loading-state">
          <div className="loading-state__ring">
            <Loader2 size={30} />
          </div>
          <h2>Checking payment status…</h2>
          <p>Fetching the latest transaction update from the gateway.</p>
        </div>
      );
    }

    if (!transactionStatus) {
      return (
        <div className="status-banner status-banner--error animate-fade-in">
          <XCircle size={22} />
          <div>
            <h3>Error</h3>
            <p>No transaction data available</p>
          </div>
        </div>
      );
    }

    if (transactionStatus.code === "0") {
      const transaction: TransactionDetails = transactionStatus.data;
      const status = transaction.Status;
      const bannerClass =
        status === "Success"
          ? "status-banner--success"
          : status === "Pending"
            ? "status-banner--warning"
            : "status-banner--error";
      const StatusIcon =
        status === "Success"
          ? CheckCircle2
          : status === "Pending"
            ? Clock3
            : XCircle;
      const statusText =
        status === "Success"
          ? "Successful"
          : status === "Pending"
            ? "Pending"
            : "Failed";

      return (
        <>
          <div className={`status-banner ${bannerClass} animate-fade-in`}>
            <StatusIcon size={22} />
            <div>
              <h3>Payment {statusText}</h3>
              <p>
                {status === "Success"
                  ? "Your payment was processed successfully."
                  : status === "Pending"
                    ? "Your payment is being processed."
                    : "Your payment could not be completed."}
              </p>
            </div>
          </div>
          <div className="transaction-details">
            <h4>Transaction Details</h4>
            <div className="details-list">
              <div className="details-row">
                <span>Transaction ID</span>
                <strong>{transaction.MerchantTxnId}</strong>
              </div>
              <div className="details-row">
                <span>Gateway Reference</span>
                <strong>{transaction.GatewayReferenceNo}</strong>
              </div>
              <div className="details-row">
                <span>Amount</span>
                <strong>NPR {transaction.Amount}</strong>
              </div>
              <div className="details-row">
                <span>Service Charge</span>
                <strong>NPR {transaction.ServiceCharge}</strong>
              </div>
              <div className="details-row">
                <span>Payment Method</span>
                <strong>
                  {transaction.Institution}
                  {transaction.Instrument &&
                  transaction.Instrument !== transaction.Institution
                    ? ` · ${transaction.Instrument}`
                    : ""}
                </strong>
              </div>
              <div className="details-row">
                <span>Date</span>
                <strong>{transaction.TransactionDate}</strong>
              </div>
              <div className="details-row">
                <span>Status</span>
                <strong>{transaction.Status}</strong>
              </div>
              {transaction.TransactionRemarks && (
                <div className="details-row">
                  <span>Remarks</span>
                  <strong>{transaction.TransactionRemarks}</strong>
                </div>
              )}
              {transaction.CbsMessage && (
                <div className="details-row">
                  <span>Message</span>
                  <strong>{transaction.CbsMessage}</strong>
                </div>
              )}
            </div>
          </div>
        </>
      );
    } else {
      return (
        <div className="status-banner status-banner--error animate-fade-in">
          <XCircle size={22} />
          <div>
            <h3>Transaction Not Found</h3>
            <p>
              {transactionStatus.message ||
                "Transaction details could not be retrieved"}
            </p>
          </div>
        </div>
      );
    }
  };

  // PDF download function
  const handleDownloadPDF = () => {
    if (!transactionStatus || transactionStatus.code !== "0") return;
    const transaction = transactionStatus.data;
    const doc = new jsPDF();
    let y = 20;

    // Add logo (if possible and safe)
    const logoImg = document.querySelector(".logo-header img");
    if (
      logoImg &&
      logoImg instanceof HTMLImageElement &&
      logoImg.src.startsWith(window.location.origin)
    ) {
      try {
        doc.addImage(logoImg, "WEBP", 85, 5, 40, 16);
      } catch (e) {
        // ignore logo embed failures
      }
    }

    doc.setFontSize(18);
    doc.text("Payment Bill", 105, y, { align: "center" });
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(13);
    doc.text("Transaction Details", 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Transaction ID:`, 20, y);
    doc.text(`${transaction.MerchantTxnId}`, 70, y);
    y += 7;
    doc.text(`Gateway Reference:`, 20, y);
    doc.text(`${transaction.GatewayReferenceNo}`, 70, y);
    y += 7;
    doc.text(`Date:`, 20, y);
    doc.text(`${transaction.TransactionDate}`, 70, y);
    y += 7;
    doc.text(`Status:`, 20, y);
    doc.text(`${transaction.Status}`, 70, y);
    y += 10;
    doc.setFontSize(13);
    doc.text("Payment Details", 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Amount:`, 20, y);
    doc.text(`NPR ${transaction.Amount}`, 70, y);
    y += 7;
    doc.text(`Service Charge:`, 20, y);
    doc.text(`NPR ${transaction.ServiceCharge}`, 70, y);
    y += 7;
    doc.text(`Payment Method:`, 20, y);
    doc.text(`${transaction.Institution} - ${transaction.Instrument}`, 70, y);
    y += 7;
    if (transaction.TransactionRemarks) {
      doc.text(`Remarks:`, 20, y);
      doc.text(`${transaction.TransactionRemarks}`, 70, y);
      y += 7;
    }
    if (transaction.CbsMessage) {
      doc.text(`Message:`, 20, y);
      doc.text(`${transaction.CbsMessage}`, 70, y);
      y += 7;
    }
    y += 5;
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("Thank you for your payment!", 105, y, { align: "center" });
    doc.save(`Payment_Bill_${transaction.MerchantTxnId}.pdf`);
  };

  if (!orderDetails && !statusMode) {
    return (
      <div className="npx-page">
        <p className="no-order-details">No order details found.</p>
      </div>
    );
  }

  return (
    <div className="npx-page">
      <div className="card-container">
        <div className="logo-header">
          <img src={logo} alt="DajuVai" />
        </div>

        {!statusMode ? (
          // Payment Form Section
          <div className="payment-card">
            {error && (
              <div className="status-banner status-banner--error animate-fade-in">
                <XCircle size={20} />
                <div>
                  <h3>Something went wrong</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {warning && (
              <div className="status-banner status-banner--warning animate-fade-in">
                <Clock3 size={20} />
                <div>
                  <h3>Development Mode</h3>
                  <p>{warning}</p>
                </div>
              </div>
            )}

            {!isLoading ? (
              <>
                <div className="header">
                  <h1>Complete Payment</h1>
                  <p>Secure and fast payment processing</p>
                </div>
                <form onSubmit={handlePayment} className="payment-form">
                  <div className="amount-summary">
                    <div className="amount-summary__left">
                      <span className="amount-summary__label">
                        Amount Payable
                      </span>
                      {(orderNumber || orderId != null) && (
                        <span className="amount-summary__order">
                          Order #{orderNumber || orderId}
                        </span>
                      )}
                    </div>
                    <span className="amount-summary__value">
                      NPR{" "}
                      {Number(parseFloat(amount) || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="form-group select-wrapper" ref={dropdownRef}>
                    <label id="instrument-label" htmlFor="instrument-trigger">
                      Select Payment Method
                    </label>
                    <button
                      type="button"
                      id="instrument-trigger"
                      className={`pm-trigger${dropdownOpen ? " pm-trigger--open" : ""}${selectedInstrument ? " pm-trigger--selected" : ""}`}
                      onClick={() => setDropdownOpen((open) => !open)}
                      disabled={paymentInstruments.length === 0}
                      aria-haspopup="listbox"
                      aria-expanded={dropdownOpen}
                    >
                      {selectedInstrument ? (
                        <>
                          <InstrumentLogo instrument={selectedInstrument} />
                          <span className="pm-trigger__label">
                            {instrumentLabel(selectedInstrument)}
                          </span>
                        </>
                      ) : (
                        <span className="pm-trigger__placeholder">
                          {paymentInstruments.length > 0
                            ? "Choose your preferred payment method…"
                            : "Loading payment methods…"}
                        </span>
                      )}
                      <ChevronDown className="pm-trigger__chevron" size={18} />
                    </button>

                    {dropdownOpen && (
                      <div className="pm-panel">
                        <div className="pm-panel__search">
                          <Search size={16} />
                          <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search bank, wallet or card…"
                            aria-label="Search payment methods"
                          />
                        </div>
                        <div
                          className="pm-panel__list"
                          role="listbox"
                          aria-labelledby="instrument-label"
                        >
                          {groupedInstruments.length === 0 ? (
                            <p className="pm-panel__empty">
                              No payment methods match “{search}”.
                            </p>
                          ) : (
                            groupedInstruments.map(({ group, items }) => (
                              <div className="pm-group" key={group}>
                                <p className="pm-group__title">
                                  {GROUP_ICONS[group]}
                                  {group}
                                </p>
                                {items.map((instrument) => (
                                  <button
                                    type="button"
                                    key={instrument.InstrumentCode}
                                    role="option"
                                    aria-selected={
                                      instrumentCode ===
                                      instrument.InstrumentCode
                                    }
                                    className={`pm-option${instrumentCode === instrument.InstrumentCode ? " pm-option--selected" : ""}`}
                                    onClick={() =>
                                      selectInstrument(
                                        instrument.InstrumentCode,
                                      )
                                    }
                                  >
                                    <InstrumentLogo instrument={instrument} />
                                    <span className="pm-option__label">
                                      {instrumentLabel(instrument)}
                                    </span>
                                    {instrumentCode ===
                                      instrument.InstrumentCode && (
                                      <Check
                                        size={16}
                                        className="pm-option__check"
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="remarks">
                      Transaction Notes (Optional)
                    </label>
                    <input
                      type="text"
                      id="remarks"
                      name="remarks"
                      placeholder="Add a note for this payment..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="npx-input"
                      maxLength={100}
                    />
                  </div>

                  {charge && (
                    <div className="charge-summary animate-fade-in">
                      <div className="charge-summary__row">
                        <span>Amount</span>
                        <span>NPR {charge.amount}</span>
                      </div>
                      <div className="charge-summary__row">
                        <span>Service Charge</span>
                        <span>NPR {charge.fee}</span>
                      </div>
                      <div className="charge-summary__row charge-summary__row--total">
                        <span>Total Payable</span>
                        <span>NPR {charge.total}</span>
                      </div>
                      {charge.estimated && (
                        <p className="charge-summary__note">
                          Estimated charges — gateway currently unreachable.
                        </p>
                      )}
                    </div>
                  )}
                  {chargeError && <p className="charge-error">{chargeError}</p>}

                  <button
                    type="submit"
                    className="pay-button"
                    disabled={isLoading || !instrumentCode}
                  >
                    <Lock size={16} />
                    <span>Pay Securely</span>
                  </button>

                  <p className="trust-note">
                    <ShieldCheck size={14} />
                    Payments are processed securely via Nepal Payment System
                  </p>
                </form>
              </>
            ) : (
              <div className="loading-state">
                <div className="loading-state__ring">
                  <Loader2 size={30} />
                </div>
                <h2>Processing your payment…</h2>
                <p>
                  Please wait while we redirect you to the secure payment
                  gateway.
                </p>
                <span className="loading-state__hint">
                  <ShieldCheck size={14} />
                  Do not close or refresh this window
                </span>
              </div>
            )}
          </div>
        ) : (
          // Payment Status Section
          <div className="payment-card">
            <div className="header">
              <h1 className="status-header">Payment Status</h1>
            </div>
            {renderTransactionStatus()}

            {transactionStatus &&
              transactionStatus.code === "0" &&
              transactionStatus.data?.Status === "Success" && (
                <button
                  onClick={handleDownloadPDF}
                  className="pay-button download-bill-btn"
                >
                  <FileDown size={16} />
                  <span>Download Bill (PDF)</span>
                </button>
              )}

            <button
              onClick={() => (window.location.href = "/")}
              className="pay-button return-home"
            >
              <Home size={16} />
              <span>Return to Home</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NepalPaymentGateway;
