import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import { useAuth } from "../context/AuthContext";
import PaymentStatusCard, { PaymentStatus } from "../Components/PaymentStatus/PaymentStatusCard";
import { API_BASE_URL } from "../config";

interface Order {
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

const PaymentSuccess: React.FC = () => {
	const { token } = useAuth();
	const [loading, setLoading] = useState(true);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
	const [orderData, setOrderData] = useState<Order | null>(null);
	const [orderId, setOrderId] = useState<number | null>(null);

	useEffect(() => {
		const url = window.location.href;
		const queryString = url.substring(url.indexOf("?") + 1);
		const normalized = queryString.replace("?", "&");
		const searchParams = new URLSearchParams(normalized);

		const oid = searchParams.get("oid");
		const did = searchParams.get("did");
		const tokenParam = searchParams.get("data");

		if (oid) setOrderId(parseInt(oid));

		const verifyAndFetch = async () => {
			if (!tokenParam || (!oid && !did)) {
				setPaymentStatus("failed");
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}/api/order/esewa/success`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					// Draft-based checkouts pass `did`; legacy orders pass `oid`.
					body: JSON.stringify({
						token: tokenParam,
						...(oid ? { orderId: parseInt(oid) } : {}),
						...(did ? { draftId: parseInt(did) } : {}),
					}),
					credentials: "include",
				});

				const result = await response.json();

				if (result.success) {
					setPaymentStatus("success");
					// The backend returns the real order id once the draft
					// materializes — prefer it over the URL param.
					const resolvedOrderId = result.data?.orderId ?? (oid ? parseInt(oid) : null);
					if (resolvedOrderId) setOrderId(resolvedOrderId);
					// Fetch order details for display
					try {
						if (!resolvedOrderId) throw new Error("no order id");
						const orderResponse = await fetch(
							`${API_BASE_URL}/api/order/customer/order/${resolvedOrderId}`,
							{
								method: "GET",
								headers: {
									Authorization: `Bearer ${token}`,
								},
								credentials: "include",
							}
						);
						if (orderResponse.ok) {
							const orderResult = await orderResponse.json();
							if (orderResult.success && orderResult.data) {
								setOrderData(orderResult.data);
							}
						}
					} catch {
						// Order fetch failed but payment succeeded — show success without details
					}
				} else {
					setPaymentStatus("failed");
				}
			} catch {
				setPaymentStatus("failed");
			} finally {
				setLoading(false);
			}
		};

		verifyAndFetch();
	}, [token]);

	return (
		<>
			<Navbar />
			<PaymentStatusCard
				status={paymentStatus}
				orderData={orderData}
				loading={loading}
			/>
		</>
	);
};

export default PaymentSuccess;
