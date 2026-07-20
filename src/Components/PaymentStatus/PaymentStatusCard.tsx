import React from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "../../Styles/PaymentStatusCard.css";

export type PaymentStatus = "success" | "pending" | "failed" | "cancelled";

interface OrderData {
	id: number;
	totalPrice: string | number;
	shippingFee: string | number;
	paymentStatus: string;
	paymentMethod: string;
	status: string;
	createdAt: string;
	instrumentName?: string;
	updatedAt: string;
}

interface PaymentStatusCardProps {
	status: PaymentStatus;
	orderData: OrderData | null;
	merchantTxnId?: string | null;
	gatewayTxnId?: string | null;
	loading?: boolean;
	onRetry?: () => void;
	onCheckStatus?: () => void;
}

const STATUS_CONFIG: Record<
	PaymentStatus,
	{ icon: string; title: string; titleClass: string; message: string; iconBg: string; iconColor: string }
> = {
	success: {
		icon: "✓",
		title: "Payment Successful",
		titleClass: "psc-header__title--success",
		message:
			"Thank you for your order. Your payment has been processed successfully.",
		iconBg: "#dcfce7",
		iconColor: "#16a34a",
	},
	pending: {
		icon: "⏳",
		title: "Payment Pending",
		titleClass: "psc-header__title--pending",
		message:
			"Your payment is being processed. We will update you shortly.",
		iconBg: "#fef3c7",
		iconColor: "#d97706",
	},
	failed: {
		icon: "✕",
		title: "Payment Failed",
		titleClass: "psc-header__title--failed",
		message:
			"Your payment could not be processed. Please try again or contact support if the amount was deducted.",
		iconBg: "#fee2e2",
		iconColor: "#dc2626",
	},
	cancelled: {
		icon: "✕",
		title: "Payment Cancelled",
		titleClass: "psc-header__title--cancelled",
		message:
			"Your payment was cancelled. No amount was charged.",
		iconBg: "#fee2e2",
		iconColor: "#dc2626",
	},
};

const toNumber = (value: string | number): number =>
	typeof value === "string" ? parseFloat(value) : value;

const formatDate = (dateString: string) =>
	new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
	status,
	orderData,
	merchantTxnId,
	gatewayTxnId,
	loading = false,
	onRetry,
	onCheckStatus,
}) => {
	const navigate = useNavigate();
	const config = STATUS_CONFIG[status];

	const handleDownloadPDF = () => {
		if (!orderData) return;
		const doc = new jsPDF();
		let y = 10;
		doc.setFontSize(18);
		doc.text("Payment & Order Bill", 105, y, { align: "center" });
		y += 10;
		doc.setFontSize(12);
		doc.text(`Order ID: #${orderData.id}`, 10, (y += 10));
		doc.text(`Order Date: ${formatDate(orderData.createdAt)}`, 10, (y += 10));
		doc.text(`Payment Method: ${orderData.paymentMethod.replace("_", " ")}`, 10, (y += 10));
		if (orderData.instrumentName) {
			doc.text(`Instrument: ${orderData.instrumentName}`, 10, (y += 10));
		}
		doc.text(`Payment Status: ${orderData.paymentStatus}`, 10, (y += 10));
		doc.text(`Order Status: ${orderData.status}`, 10, (y += 10));
		if (merchantTxnId) {
			doc.text(`Merchant Txn ID: ${merchantTxnId}`, 10, (y += 10));
		}
		if (gatewayTxnId) {
			doc.text(`Gateway Txn ID: ${gatewayTxnId}`, 10, (y += 10));
		}
		y += 8;
		doc.text("Price Breakdown:", 10, (y += 5));
		doc.text(
			`Subtotal: Rs ${(toNumber(orderData.totalPrice) - toNumber(orderData.shippingFee)).toFixed(2)}`,
			10,
			(y += 10)
		);
		doc.text(`Shipping Fee: Rs ${toNumber(orderData.shippingFee).toFixed(2)}`, 10, (y += 10));
		doc.text(`Total: Rs ${toNumber(orderData.totalPrice).toFixed(2)}`, 10, (y += 10));
		doc.save(`Order_Bill_${orderData.id}.pdf`);
	};

	if (loading) {
		return (
			<div className="psc psc--loading">
				<div className="psc__card">
					<div className="psc__spinner" />
					<p className="psc__loading-text">Loading order details...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="psc">
			<div className="psc__card">
				{/* Header */}
				<div className="psc-header">
					<div
						className="psc-header__icon"
						style={{ backgroundColor: config.iconBg, color: config.iconColor }}
					>
						{config.icon}
					</div>
					<h1 className={`psc-header__title ${config.titleClass}`}>
						{config.title}
					</h1>
					<p className="psc-header__message">{config.message}</p>
				</div>

				{/* Transaction Info */}
				{(merchantTxnId || gatewayTxnId) && (
					<div className="psc-section">
						<h2 className="psc-section__title">Transaction Details</h2>
						<div className="psc-section__grid">
							{merchantTxnId && (
								<div className="psc-section__item">
									<span className="psc-section__label">Merchant Transaction ID</span>
									<span className="psc-section__value psc-section__value--mono">
										{merchantTxnId}
									</span>
								</div>
							)}
							{gatewayTxnId && (
								<div className="psc-section__item">
									<span className="psc-section__label">Gateway Transaction ID</span>
									<span className="psc-section__value psc-section__value--mono">
										{gatewayTxnId}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Order Info */}
				{orderData && (
					<div className="psc-section">
						<h2 className="psc-section__title">Order Details</h2>
						<div className="psc-section__grid">
							<div className="psc-section__item">
								<span className="psc-section__label">Order ID</span>
								<span className="psc-section__value">#{orderData.id}</span>
							</div>
							<div className="psc-section__item">
								<span className="psc-section__label">Order Date</span>
								<span className="psc-section__value">{formatDate(orderData.createdAt)}</span>
							</div>
							<div className="psc-section__item">
								<span className="psc-section__label">Payment Method</span>
								<span className="psc-section__value psc-section__value--capitalize">
									{orderData.paymentMethod.replace("_", " ")}
								</span>
							</div>
							{orderData.instrumentName && (
								<div className="psc-section__item">
									<span className="psc-section__label">Instrument</span>
									<span className="psc-section__value">{orderData.instrumentName}</span>
								</div>
							)}
							<div className="psc-section__item">
								<span className="psc-section__label">Payment Status</span>
								<span className={`psc-badge psc-badge--${orderData.paymentStatus.toLowerCase()}`}>
									{orderData.paymentStatus}
								</span>
							</div>
							<div className="psc-section__item">
								<span className="psc-section__label">Order Status</span>
								<span className={`psc-badge psc-badge--${orderData.status.toLowerCase()}`}>
									{orderData.status}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Price Breakdown — only for success */}
				{orderData && status === "success" && (
					<div className="psc-section psc-price">
						<h2 className="psc-section__title">Price Breakdown</h2>
						<div className="psc-price__rows">
							<div className="psc-price__row">
								<span>Subtotal</span>
								<span>
									Rs{" "}
									{(
										toNumber(orderData.totalPrice) -
										toNumber(orderData.shippingFee)
									).toFixed(2)}
								</span>
							</div>
							<div className="psc-price__row">
								<span>Shipping Fee</span>
								<span>Rs {toNumber(orderData.shippingFee).toFixed(2)}</span>
							</div>
							<div className="psc-price__row psc-price__row--total">
								<span>Total</span>
								<span>Rs {toNumber(orderData.totalPrice).toFixed(2)}</span>
							</div>
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="psc-actions">
					{status === "success" && orderData && (
						<button onClick={handleDownloadPDF} className="psc-btn psc-btn--primary">
							Download Bill (PDF)
						</button>
					)}
					{status === "success" && (
						<button
							onClick={() => navigate("/user-profile", { state: { activeTab: "orders" } })}
							className="psc-btn psc-btn--secondary"
						>
							View My Orders
						</button>
					)}
					{status === "pending" && onCheckStatus && (
						<button onClick={onCheckStatus} className="psc-btn psc-btn--secondary">
							Check Status
						</button>
					)}
					{(status === "failed" || status === "cancelled") && (
						<button
							onClick={onRetry || (() => navigate("/checkout"))}
							className="psc-btn psc-btn--primary"
						>
							Try Again
						</button>
					)}
					<button
						onClick={() => navigate("/")}
						className="psc-btn psc-btn--ghost"
					>
						Continue Shopping
					</button>
				</div>
			</div>
		</div>
	);
};

export default PaymentStatusCard;
