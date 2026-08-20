import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import { useAuth } from "../context/AuthContext";
import PaymentStatusCard, { PaymentStatus } from "../Components/PaymentStatus/PaymentStatusCard";
import { API_BASE_URL } from "../config";

interface Order {
	id: number;
	orderNumber?: string | null;
	totalPrice: string | number;
	shippingFee: string | number;
	paymentStatus: string;
	paymentMethod: string;
	status: string;
	mTransactionId: string;
	createdAt: string;
	instrumentName: string;
	updatedAt: string;
}

function normalizeStatus(paymentStatus: string, orderStatus: string): PaymentStatus {
	const ps = paymentStatus?.toLowerCase();
	const os = orderStatus?.toLowerCase();

	if (ps === "paid" || os === "confirmed") return "success";
	if (ps === "unpaid" && (os === "cancelled" || os === "failed")) return "cancelled";
	if (os === "pending" || os === "processing" || os === "delayed") return "pending";
	if (ps === "unpaid") return "pending";
	return "failed";
}

const TransactionSuccess: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [orderData, setOrderData] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
	const auth = useAuth();
	const token = auth?.token;

	const merchantTxnId = searchParams.get("MerchantTxnId");
	const gatewayTxnId = searchParams.get("GatewayTxnId");

	const cancelledRef = useRef(false);
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [isCheckingNow, setIsCheckingNow] = useState(false);

	const fetchOrder = useCallback(
		async (options: { isFirstFetch?: boolean; isManualCheck?: boolean } = {}) => {
			if (!merchantTxnId) return;
			if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

			try {
				const orderResponse = await fetch(
					`${API_BASE_URL}/api/order/search/merchant-transactionId`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							mTransactionId: merchantTxnId,
							// The gateway redirect back to this page means the
							// payment round-trip finished; a still-pending draft
							// is therefore a cancellation/timeout, not an
							// in-flight payment.
							returnedFromGateway: Boolean(gatewayTxnId),
						}),
					}
				);

				if (cancelledRef.current) return;

				if (orderResponse.ok) {
					const orderResult = await orderResponse.json();
					if (cancelledRef.current) return;
					if (orderResult.success && orderResult.data) {
						setOrderData(orderResult.data);
						const nextStatus = normalizeStatus(
							orderResult.data.paymentStatus,
							orderResult.data.status
						);
						setPaymentStatus(nextStatus);

						// The gateway redirect back to this page carries no
						// definitive status of its own - the order's real
						// status is only known once our NPX/eSewa webhook (or
						// the stale-order cleanup cron) updates it server-side,
						// which can happen a few seconds to minutes after this
						// page loads. Keep polling while still "pending" so
						// the page corrects itself instead of being stuck on
						// a stale snapshot from the first load.
						if (nextStatus === "pending" && !options.isManualCheck) {
							pollTimeoutRef.current = setTimeout(
								() => fetchOrder({}),
								5000
							);
						}
					}
				}
			} catch (error) {
				console.error("Error fetching order data:", error);
			} finally {
				if (!cancelledRef.current) {
					if (options.isFirstFetch) setLoading(false);
					if (options.isManualCheck) setIsCheckingNow(false);
				}
			}
		},
		[merchantTxnId, gatewayTxnId, token]
	);

	useEffect(() => {
		if (!merchantTxnId) {
			setLoading(false);
			return;
		}

		cancelledRef.current = false;
		fetchOrder({ isFirstFetch: true });

		return () => {
			cancelledRef.current = true;
			if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [merchantTxnId, token]);

	const handleCheckStatusNow = () => {
		setIsCheckingNow(true);
		fetchOrder({ isManualCheck: true });
	};

	return (
		<>
			<Navbar />
			<PaymentStatusCard
				status={paymentStatus}
				orderData={orderData}
				merchantTxnId={merchantTxnId}
				gatewayTxnId={gatewayTxnId}
				loading={loading}
				onCheckStatus={handleCheckStatusNow}
				onRetry={() => navigate("/checkout")}
			/>
		</>
	);
};

export default TransactionSuccess;
