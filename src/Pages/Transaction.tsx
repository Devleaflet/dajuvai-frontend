import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../Styles/Transaction.css";
import jsPDF from "jspdf";
import { API_BASE_URL } from "../config";

interface Order {
  id: number;
  totalPrice: string | number;
  shippingFee: string | number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  mTransactionId: string;
  createdAt: string;
  instrumentName: string;
  orderedById: number;
  updatedAt: string;
}

const TransactionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const token = auth?.token;

  const merchantTxnId = searchParams.get("MerchantTxnId");
  const gatewayTxnId = searchParams.get("GatewayTxnId");

  useEffect(() => {
    const hitAPIs = async () => {
      if (merchantTxnId) {
        //("🔍 Checking order for MerchantTxnId:", merchantTxnId);
        try {
          const orderResponse = await fetch(
            `${API_BASE_URL}/api/order/search/merchant-transactionId`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ mTransactionId: merchantTxnId }),
            }
          );

          if (orderResponse.ok) {
            const orderResult = await orderResponse.json();
            if (orderResult.success && orderResult.data) {
              //("✅ Order retrieved successfully:", orderResult.data);
              setOrderData(orderResult.data);
            } else {
              console.warn("❌ No order data found for this transaction ID.");
            }
          } else {
            console.error("⚠️ Failed to fetch order data. HTTP Error:", orderResponse.status);
          }
        } catch (error) {
          console.error("💥 Error hitting APIs:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.warn("⚠️ Missing MerchantTxnId in query params.");
        setLoading(false);
      }
    };

    hitAPIs();
  }, [merchantTxnId, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "transaction-success__status--paid";
      case "pending":
        return "transaction-success__status--pending";
      case "failed":
        return "transaction-success__status--failed";
      case "confirmed":
        return "transaction-success__status--confirmed";
      default:
        return "transaction-success__status--default";
    }
  };

  const toNumber = (value: string | number): number =>
    typeof value === "string" ? parseFloat(value) : value;

  // Loading state
  if (loading) {
    //("⌛ Loading order details...");
    return (
      <>
        <Navbar />
        <div className="transaction-success transaction-success--loading">
          <div className="transaction-success__container">
            <div className="transaction-success__spinner"></div>
            <p className="transaction-success__loading-text">
              Loading order details...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Failed order (no data found)
  if (!orderData) {
    //(" Order verification failed or order not found.");
    return (
      <>
        <Navbar />
        <div className="transaction-success transaction-success--failed">
          <div className="transaction-success__wrapper">
            <div className="transaction-success__header">
              <div className="transaction-success__header-icon transaction-success__header-icon--failed"></div>
              <h1 className="transaction-success__header-title">
                Payment Failed
              </h1>
              <p className="transaction-success__header-text">
                We couldn’t verify your payment or retrieve your order details.
                Please try again or contact support if the amount was deducted.
              </p>
            </div>

            <div className="transaction-success__details">
              <h2 className="transaction-success__details-title">
                Transaction Info
              </h2>
              <div className="transaction-success__details-grid">
                <div className="transaction-success__details-item">
                  <p className="transaction-success__details-label">
                    Merchant Transaction ID
                  </p>
                  <p className="transaction-success__details-value">
                    {merchantTxnId || "N/A"}
                  </p>
                </div>
                <div className="transaction-success__details-item">
                  <p className="transaction-success__details-label">
                    Gateway Transaction ID
                  </p>
                  <p className="transaction-success__details-value">
                    {gatewayTxnId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Success case
  //("✅ Payment success for Order ID:", orderData.id);

  const handleDownloadPDF = () => {
    if (!orderData) return;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(18);
    doc.text("Payment & Order Bill", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(12);
    doc.text(`Merchant Transaction ID: ${merchantTxnId || "N/A"}`, 10, (y += 10));
    doc.text(`Gateway Transaction ID: ${gatewayTxnId || "N/A"}`, 10, (y += 10));
    doc.text("Order Details:", 10, (y += 15));
    doc.text(`Order ID: #${orderData.id}`, 10, (y += 10));
    doc.text(`Order Date: ${formatDate(orderData.createdAt)}`, 10, (y += 10));
    doc.text(`Payment Method: ${orderData.paymentMethod.replace("_", " ")}`, 10, (y += 10));
    doc.text(`Instrument Name: ${orderData.instrumentName}`, 10, (y += 10));
    doc.text(`Payment Status: ${orderData.paymentStatus}`, 10, (y += 10));
    doc.text(`Order Status: ${orderData.status}`, 10, (y += 10));
    doc.text(`Ordered By ID: ${orderData.orderedById}`, 10, (y += 10));
    doc.text(`Last Updated: ${formatDate(orderData.updatedAt)}`, 10, (y += 10));
    doc.text("Price Breakdown:", 10, (y += 15));
    doc.text(
      `Subtotal: Rs ${(toNumber(orderData.totalPrice) - toNumber(orderData.shippingFee)).toFixed(2)}`,
      10,
      (y += 10)
    );
    doc.text(`Shipping Fee: Rs ${toNumber(orderData.shippingFee).toFixed(2)}`, 10, (y += 10));
    doc.text(`Total: Rs ${toNumber(orderData.totalPrice).toFixed(2)}`, 10, (y += 10));
    doc.save(`Order_Bill_${orderData.id}.pdf`);
  };

  return (
    <>
      <Navbar />
      <div className="transaction-success">
        <div className="transaction-success__wrapper">
          <div className="transaction-success__header">
            <div className="transaction-success__header-icon"></div>
            <h1 className="transaction-success__header-title">
              Payment Response!
            </h1>
            <p className="transaction-success__header-text">
              Thank you for your order. Your payment has been processed
              successfully.
            </p>
          </div>

          <div className="transaction-success__details">
            <h2 className="transaction-success__details-title">
              Transaction Details
            </h2>
            <div className="transaction-success__details-grid">
              <div className="transaction-success__details-item">
                <p className="transaction-success__details-label">
                  Merchant Transaction ID
                </p>
                <p className="transaction-success__details-value">
                  {merchantTxnId || "N/A"}
                </p>
              </div>
              <div className="transaction-success__details-item">
                <p className="transaction-success__details-label">
                  Gateway Transaction ID
                </p>
                <p className="transaction-success__details-value">
                  {gatewayTxnId || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {orderData && (
            <>
              <div className="transaction-success__order">
                <h2 className="transaction-success__order-title">
                  Order Details
                </h2>
                <div className="transaction-success__order-grid">
                  <div className="transaction-success__order-column">
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Order ID:
                      </span>
                      <span className="transaction-success__order-value">
                        #{orderData.id}
                      </span>
                    </div>
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Order Date:
                      </span>
                      <span className="transaction-success__order-value">
                        {formatDate(orderData.createdAt)}
                      </span>
                    </div>
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Payment Method:
                      </span>
                      <span className="transaction-success__order-value capitalize">
                        {orderData.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Instrument Name:
                      </span>
                      <span className="transaction-success__order-value">
                        {orderData.instrumentName}
                      </span>
                    </div>
                  </div>

                  <div className="transaction-success__order-column">
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Payment Status:
                      </span>
                      <span
                        className={`transaction-success__order-status ${getStatusColor(
                          orderData.paymentStatus
                        )}`}
                      >
                        {orderData.paymentStatus}
                      </span>
                    </div>
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Order Status:
                      </span>
                      <span
                        className={`transaction-success__order-status ${getStatusColor(
                          orderData.status
                        )}`}
                      >
                        {orderData.status}
                      </span>
                    </div>
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Ordered By ID:
                      </span>
                      <span className="transaction-success__order-value">
                        {orderData.orderedById}
                      </span>
                    </div>
                    <div className="transaction-success__order-item">
                      <span className="transaction-success__order-label">
                        Last Updated:
                      </span>
                      <span className="transaction-success__order-value">
                        {formatDate(orderData.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="transaction-success__price">
                  <h3 className="transaction-success__price-title">
                    Price Breakdown
                  </h3>
                  <div className="transaction-success__price-items">
                    <div className="transaction-success__price-item">
                      <span className="transaction-success__price-label">
                        Subtotal:
                      </span>
                      <span className="transaction-success__price-value">
                        Rs:
                        {(
                          toNumber(orderData.totalPrice) -
                          toNumber(orderData.shippingFee)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="transaction-success__price-item">
                      <span className="transaction-success__price-label">
                        Shipping Fee:
                      </span>
                      <span className="transaction-success__price-value">
                        Rs:{toNumber(orderData.shippingFee).toFixed(2)}
                      </span>
                    </div>
                    <div className="transaction-success__price-item transaction-success__price-item--total">
                      <span className="transaction-success__price-label">
                        Total:
                      </span>
                      <span className="transaction-success__price-value">
                        Rs:{toNumber(orderData.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right", margin: "1.5rem 0" }}>
                <button onClick={handleDownloadPDF} className="pay-button">
                  Download Bill (PDF)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionSuccess;
