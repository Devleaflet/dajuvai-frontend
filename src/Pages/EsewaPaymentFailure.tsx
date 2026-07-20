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

const EsewaPaymentFailure: React.FC = () => {
	const { token } = useAuth();
	const [loading, setLoading] = useState(true);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("cancelled");
	const [orderData, setOrderData] = useState<Order | null>(null);

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const orderId = searchParams.get("oid");

		const handleFailure = async () => {
			if (!orderId) {
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}/api/order/esewa/fail`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ orderId: parseInt(orderId) }),
					credentials: "include",
				});

				const result = await response.json();

				if (result.success) {
					setPaymentStatus("cancelled");
					// Fetch order details to display
					try {
						const orderResponse = await fetch(
							`${API_BASE_URL}/api/order/customer/order/${orderId}`,
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
						// Order fetch failed — show cancellation without details
					}
				}
			} catch {
				// Network error — show cancelled state anyway
			} finally {
				setLoading(false);
			}
		};

		handleFailure();
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

export default EsewaPaymentFailure;
