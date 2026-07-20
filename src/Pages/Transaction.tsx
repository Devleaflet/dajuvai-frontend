import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
	const [orderData, setOrderData] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
	const auth = useAuth();
	const token = auth?.token;

	const merchantTxnId = searchParams.get("MerchantTxnId");
	const gatewayTxnId = searchParams.get("GatewayTxnId");

	useEffect(() => {
		const hitAPIs = async () => {
			if (merchantTxnId) {
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
							setOrderData(orderResult.data);
							setPaymentStatus(
								normalizeStatus(orderResult.data.paymentStatus, orderResult.data.status)
							);
						}
					}
				} catch (error) {
					console.error("Error fetching order data:", error);
				} finally {
					setLoading(false);
				}
			} else {
				setLoading(false);
			}
		};

		hitAPIs();
	}, [merchantTxnId, token]);

	return (
		<>
			<Navbar />
			<PaymentStatusCard
				status={paymentStatus}
				orderData={orderData}
				merchantTxnId={merchantTxnId}
				gatewayTxnId={gatewayTxnId}
				loading={loading}
			/>
		</>
	);
};

export default TransactionSuccess;
