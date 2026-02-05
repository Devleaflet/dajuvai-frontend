import CryptoJS from 'crypto-js';
import React, { useEffect, useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Footer from '../Components/Footer';
import AlertModal from '../Components/Modal/AlertModal';
import Navbar from '../Components/Navbar';
import '../Styles/CheckOut.css';
import logo from '../assets/logo.webp';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface PromoCode {
	id: number;
	promoCode: string;
	discountPercentage: number;
}

interface CartItem {
	id: number;
	quantity: number;
	price: string;
	name: string;
	description?: string;
	image: string | null;
	variantId?: number;
	variant?: {
		id?: number;
		name?: string;
		sku?: string;
		attributes?: any;
		attributeValues?: any;
		attrs?: any;
		attributeSpecs?: any;
		stock?: number;
	};
	attributes?: any;
	variantAttributes?: any;
	product?: {
		id: number;
		name: string;
		vendorId?: number;
		vendor?: {
			id?: number;
			businessName?: string;
			district?: { name: string };
		};
	};
}

interface ShippingGroup {
	vendorDistrict: string;
	vendorName: string;
	items: CartItem[];
	shippingCost: number;
	subtotal: number;
	lineTotal: number;
}

const OrderSuccessModal: React.FC<{
	open: boolean;
	onClose: () => void;
	onViewOrder: () => void;
	onContinueShopping: () => void;
	totalAmount: number;
	paymentMethod: string;
}> = ({
	open,
	onClose,
	onViewOrder,
	onContinueShopping,
	totalAmount,
	paymentMethod,
}) => {
	if (!open) return null;

	return (
		<div className="checkout-success-modal-overlay">
			<div className="checkout-success-modal">
				<div className="checkout-success-modal__content">
					<div className="checkout-success-modal__header">
						<div className="checkout-success-modal__icon-wrapper">
							<div className="checkout-success-modal__icon">✓</div>
						</div>
						{/* <button
							className="checkout-success-modal__close"
							onClick={onClose}
						>
							×
						</button> */}
					</div>
					<h2 className="checkout-success-modal__title">Order Confirmed!</h2>
					<p className="checkout-success-modal__message">
						Thank you for your purchase! Your order has been successfully placed
						and is being processed. You'll receive a confirmation email with
						your order details shortly.
					</p>
					<div className="checkout-success-modal__order-info">
						<div className="checkout-success-modal__info-item">
							<span>Order Total:</span>
							<span>Rs {totalAmount.toLocaleString()}</span>
						</div>
						<div className="checkout-success-modal__info-item">
							<span>Payment Method:</span>
							<span>{paymentMethod.replace(/_/g, ' ')}</span>
						</div>
					</div>
					<div className="checkout-success-modal__actions">
						<button
							className="checkout-success-modal__btn checkout-success-modal__btn--primary"
							onClick={onViewOrder}
						>
							View Order Details
						</button>
						<button
							className="checkout-success-modal__btn checkout-success-modal__btn--secondary"
							onClick={onContinueShopping}
						>
							Continue Shopping
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const Checkout: React.FC = () => {
	useEffect(() => {
		const listener = (event: MessageEvent) => {
			if (event.data?.action === 'refresh') {
				//('----------------Page refresh----------------------');
				window.location.reload();
			}
		};
		window.addEventListener('message', listener);
		return () => window.removeEventListener('message', listener);
	}, []);

	const location = useLocation();
	const {
		cartItems: contextCartItems,
		handleIncreaseQuantity,
		handleDecreaseQuantity,
	} = useCart();
	let cartItems: CartItem[] = contextCartItems;

	// State for managing Buy Now quantities
	const [buyNowQuantities, setBuyNowQuantities] = useState<{
		[key: number]: number;
	}>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	// Handle "Buy Now" case
	if (location.state?.buyNow && location.state?.products?.length > 0) {
		const buyNowProduct = location.state.products[0];
		const { product, quantity } = buyNowProduct;
		cartItems = [
			{
				id: product.id,
				quantity,
				price: product.price,
				name: product.name,
				description: product.description || '',
				image: product.image || null,
				variantId: product.selectedVariant?.id,
				variant: product.selectedVariant
					? {
							id: product.selectedVariant.id,
							attributes: product.selectedVariant.attributes,
							calculatedPrice: product.selectedVariant.calculatedPrice,
							originalPrice: product.selectedVariant.originalPrice,
							stock: product.selectedVariant.stock,
							variantImgUrls: product.selectedVariant.variantImgUrls,
					  }
					: undefined,
				product: {
					id: product.id,
					name: product.name,
					vendorId: product.vendor?.id,
					vendor: product.vendor
						? {
								id: product.vendor.id,
								businessName: product.vendor.businessName || 'Unknown Vendor',
								district: product.vendor.district || {
									name: 'Unknown District',
								},
						  }
						: undefined,
				},
			},
		];
	}

	const navigate = useNavigate();
	const [billingDetails, setBillingDetails] = useState({
		fullName: '',
		province: '',
		district: '',
		city: '',
		landmark: '',
		streetAddress: '',
		phoneNumber: '',
	});

	const { user, token } = useAuth();
	const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
	const [termsAgreed, setTermsAgreed] = useState(false);
	const [selectedPaymentMethod, setSelectedPaymentMethod] =
		useState('CASH_ON_DELIVERY');

	const availablePaymentMethods = [
		{ id: 'CASH_ON_DELIVERY', name: 'Cash on Delivery' },
		// {
		// 	id: 'ESEWA',
		// 	name: 'eSewa',
		// 	disabled: true,
		// 	message: 'Currently unavailable. Please choose another method.',
		// },
		{ id: "ESEWA", name: "eSewa" },
		{ id: 'NPX', name: 'Nepal Payment System' },
	];

	const [isPlacingOrder, setIsPlacingOrder] = useState(false);
	const [showAlert, setShowAlert] = useState(false);
	const [alertMessage, setAlertMessage] = useState('');
	const [showPromoField, setShowPromoField] = useState(false);
	const [enteredPromoCode, setEnteredPromoCode] = useState('');
	const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(
		null
	);
	const [promoError, setPromoError] = useState('');
	const [provinceData, setProvinceData] = useState<string[]>([]);
	const [districtData, setDistrictData] = useState<string[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const provinceResponse = await fetch(
					'/Nepal-Address-API-main/data/provinces.json'
				);
				const data = await provinceResponse.json();
				setProvinceData(data.provinces.map(capitalizeFirstLetter));
			} catch (error) {
				console.error('Error fetching provinces:', error);
			}
		};
		fetchData();
	}, []);

	function capitalizeFirstLetter(string: string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	async function fetchDistricts(province: string) {
		try {
			const districtResponse = await fetch(
				`/Nepal-Address-API-main/data/districtsByProvince/${province.toLowerCase()}.json`
			);
			const data = await districtResponse.json();
			setDistrictData(data.districts.map(capitalizeFirstLetter));
		} catch (error) {
			console.error('Error fetching district data:', error);
			setDistrictData([]);
		}
	}

	useEffect(() => {
		if (billingDetails.province) {
			fetchDistricts(billingDetails.province);
		} else {
			setDistrictData([]);
		}
	}, [billingDetails.province]);

	const [formData, setFormData] = useState({
		amount: '10',
		tax_amount: '0',
		total_amount: '10',
		transaction_uuid: uuidv4(),
		product_service_charge: '0',
		product_delivery_charge: '0',
		product_code: 'EPAYTEST',
		success_url: `https://dajuvai.com/order/esewa-payment-success`,
		failure_url: `https://dajuvai.com/esewa-payment-failure`,
		signed_field_names: 'total_amount,transaction_uuid,product_code',
		signature: '',
		secret: '8gBm/:&EnhH.1/q',
	});

	useEffect(() => {
		const { total_amount, transaction_uuid, product_code, secret } = formData;
		const hashedSignature = generateSignature(
			total_amount,
			transaction_uuid,
			product_code,
			secret
		);
		setFormData((prev) => ({ ...prev, signature: hashedSignature }));
	}, [formData.total_amount]);

	const generateSignature = (
		total_amount: string,
		transaction_uuid: string,
		product_code: string,
		secret: string
	): string => {
		const hashString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
		const hash = CryptoJS.HmacSHA256(hashString, secret);
		return CryptoJS.enc.Base64.stringify(hash);
	};

	const validateField = (name: string, value: string): string => {
		switch (name) {
			case 'fullName':
				if (!value.trim()) return 'Full name is required';
				if (!/^[a-zA-Z\s]+$/.test(value))
					return 'Full name must contain only letters and spaces';
				if (value.trim().length < 2)
					return 'Full name must be at least 2 characters';
				return '';
			case 'province':
				if (!value.trim()) return 'Province is required';
				if (!provinceData.includes(value))
					return 'Please select a valid province';
				return '';
			case 'district':
				if (!value.trim()) return 'District is required';
				if (!districtData.includes(value))
					return 'Please select a valid district';
				return '';
			case 'city':
				if (!value.trim()) return 'City is required';
				if (!/^[a-zA-Z\s]+$/.test(value))
					return 'City must contain only letters and spaces';
				if (value.trim().length < 2)
					return 'City must be at least 2 characters';
				return '';
			case 'streetAddress':
				if (!value.trim()) return 'Street address is required';
				if (value.trim().length < 5)
					return 'Street address must be at least 5 characters';
				return '';
			case 'phoneNumber':
				if (!value.trim()) return 'Phone number is required';
				if (!/^\d+$/.test(value))
					return 'Phone number must contain only numbers';
				if (!/^9\d{9}$/.test(value))
					return 'Phone number must start with 9 and be exactly 10 digits';
				return '';
			default:
				return '';
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		let filteredValue = value;
		if (name === 'phoneNumber') {
			filteredValue = value.replace(/\D/g, '').slice(0, 10);
		} else if (name === 'fullName' || name === 'city') {
			filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
		}
		setBillingDetails((prev) => ({ ...prev, [name]: filteredValue }));
		if (touched[name] || errors[name]) {
			const error = validateField(name, filteredValue);
			setErrors((prev) => ({ ...prev, [name]: error }));
		}
	};

	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setTouched((prev) => ({ ...prev, [name]: true }));
		const error = validateField(name, value);
		setErrors((prev) => ({ ...prev, [name]: error }));
	};

	const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTermsAgreed(e.target.checked);
	};

	const handlePaymentMethodChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setSelectedPaymentMethod(e.target.value);
	};

	const handleApplyPromoCode = async () => {
		if (!enteredPromoCode.trim()) {
			setPromoError('Please enter a promo code');
			return;
		}
		try {
			const response = await fetch(`${API_BASE_URL}/api/order/check-promo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ promoCode: enteredPromoCode }),
			});

			const result = await response.json();
			if (response.ok && result.success) {
				setPromoError('');
				setAlertMessage(
					`Promo code "${result.data.promoCode}" applied successfully!`
				);
				setShowAlert(true);
				setAppliedPromoCode(result.data);
			} else {
				setPromoError(result.msg || 'Invalid promo code');
				setAppliedPromoCode(null);
			}
		} catch (error) {
			console.error('Error applying promo code:', error);
			setPromoError('Something went wrong. Please try again.');
		}
	};

	const handleRemovePromoCode = () => {
		setAppliedPromoCode(null);
		setEnteredPromoCode('');
		setPromoError('');
	};

	const fetchUser = async () => {
		if (!user?.id || !token) {
			console.warn('User or token not available, skipping user data fetch');
			return;
		}
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/auth/users/${user.id}`,
				{
					credentials: 'include',
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
			const data = await response.json();

			if (data.success && data.data) {
				const newBillingDetails = {
					fullName: data.data.fullName || '',
					province: data.data.address?.province || '',
					district: data.data.address?.district || '',
					landmark: data.data.address?.landmark || '',
					streetAddress: data.data.address?.localAddress || '',
					phoneNumber:
						data.data.phoneNumber &&
						validateField('phoneNumber', data.data.phoneNumber) === ''
							? data.data.phoneNumber
							: '',
					city: data.data.address?.city || '',
				};
				setBillingDetails(newBillingDetails);

				// Validate fetched data
				Object.entries(newBillingDetails).forEach(([key, value]) => {
					if (touched[key]) {
						const error = validateField(key, value);
						setErrors((prev) => ({ ...prev, [key]: error }));
					}
				});

				if (data.data.address?.province) {
					fetchDistricts(data.data.address.province);
				}
			} else {
				setAlertMessage('Failed to fetch user data.');
				setShowAlert(true);
			}
		} catch (error) {
			console.error('Error fetching user data:', error);
			setAlertMessage('An error occurred while fetching user data.');
			setShowAlert(true);
		}
	};

	useEffect(() => {
		if (user?.id && token) {
			fetchUser();
		}
	}, [user?.id, token]);

	const handlePlaceOrder = async () => {
		// Validate all fields
		const newErrors: Record<string, string> = {};
		const newTouched: Record<string, boolean> = {};
		let isValid = true;

		Object.keys(billingDetails).forEach((field) => {
			const error = validateField(
				field,
				billingDetails[field as keyof typeof billingDetails]
			);
			newErrors[field] = error;
			newTouched[field] = true;
			if (error) isValid = false;
		});

		setErrors((prev) => ({ ...prev, ...newErrors }));
		setTouched((prev) => ({ ...prev, ...newTouched }));

		if (!isValid) {
			setAlertMessage(
				'Please correct the errors in the form before submitting.'
			);
			setShowAlert(true);
			setIsPlacingOrder(false);
			return;
		}

		if (!termsAgreed) {
			setAlertMessage('Please agree to the terms and conditions');
			setShowAlert(true);
			setIsPlacingOrder(false);
			return;
		}

		if (cartItems.length === 0) {
			setAlertMessage('Your cart is empty');
			setShowAlert(true);
			setIsPlacingOrder(false);
			return;
		}

		setIsPlacingOrder(true);

		try {
			let orderData;
			if (location.state?.buyNow && cartItems.length === 1) {
				const buyNowItem = cartItems[0];
				const finalQuantity =
					buyNowQuantities[buyNowItem.id] || buyNowItem.quantity;

				orderData = {
					isBuyNow: true,
					productId: buyNowItem.id,
					variantId: buyNowItem.variantId || undefined,
					quantity: finalQuantity,
					shippingAddress: {
						province: billingDetails.province,
						city: billingDetails.city,
						district: billingDetails.district,
						streetAddress: billingDetails.streetAddress,
						landmark: billingDetails.landmark || undefined,
					},
					paymentMethod: selectedPaymentMethod,
					phoneNumber: billingDetails.phoneNumber,
					fullName: billingDetails.fullName,
				};

				if (!orderData.variantId) {
					delete orderData.variantId;
				}
			} else {
				const orderItems = cartItems.map((item) => ({
					productId: item.id,
					quantity: item.quantity,
					variantId: item.variantId || undefined,
				}));

				orderData = {
					fullName: billingDetails.fullName,
					shippingAddress: {
						province: billingDetails.province,
						city: billingDetails.city,
						district: billingDetails.district,
						streetAddress: billingDetails.streetAddress,
						landmark: billingDetails.landmark || undefined,
					},
					paymentMethod: selectedPaymentMethod,
					phoneNumber: billingDetails.phoneNumber,
					items: orderItems,
					promoCode: enteredPromoCode || undefined,
				};
			}

			//('Sending order ', JSON.stringify(orderData, null, 2));

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};
			if (token) headers['Authorization'] = `Bearer ${token}`;

			const response = await fetch(`${API_BASE_URL}/api/order`, {
				method: 'POST',
				headers,
				body: JSON.stringify(orderData),
				credentials: 'include',
			});

			const result = await response.json();
			//('Server response:', result);

			if (result.success) {
				if (selectedPaymentMethod === 'CASH_ON_DELIVERY') {
					// Show custom popup with navigation options
					const deliveryTime = getOverallDeliveryTime();
					setAlertMessage(
						`Your order has been placed successfully! Expected delivery: ${deliveryTime}. Do you want to see full details?`
					);
					setShowAlert(true);
					// Store order details for navigation
					const orderDetails = {
						orderId: result.data?.id || null,
						totalAmount: finalTotal,
					};
					// Define buttons for the modal
					const buttons = [
						{
							label: 'Go to Order Details',
							action: () => {
								navigate('/user-profile', {
									state: { activeTab: 'orders', orderDetails },
								});
								setShowAlert(false);
							},
							style: { backgroundColor: '#ff6b35', color: 'white' },
						},
						{
							label: 'Shop More',
							action: () => {
								navigate('/shop');
								setShowAlert(false);
							},
							style: { backgroundColor: '#22c55e', color: 'white' },
						},
					];
					setShowAlert(true);
				} else if (selectedPaymentMethod === 'ESEWA') {
					if (result.esewaRedirectUrl) {
						//('Redirecting to eSewa:', result.esewaRedirectUrl.url);
						window.location.href = result.esewaRedirectUrl.url;
					} else {
						throw new Error('eSewa redirect URL not provided');
					}
				}
				// } else if (selectedPaymentMethod === 'NPX') {
				//   //('Redirecting to NPX payment page');
				//   navigate('/order-page', {
				//     state: {
				//       orderDetails: {
				//         orderId: result.data?.id || null,
				//         totalAmount: finalTotal,
				//       },
				//     },
				//   });
				// }

				setTimeout(() => {
					if (
						selectedPaymentMethod !== 'CASH_ON_DELIVERY' &&
						selectedPaymentMethod !== 'ESEWA'
					) {
						navigate('/order-page', {
							state: {
								orderDetails: {
									orderId: result.data?.id || null,
									totalAmount: finalTotal,
								},
							},
						});
					}
				}, 1500);
			} else {
				setAlertMessage(
					`Failed to place order: ${result.message || 'Unknown error'}`
				);
				setShowAlert(true);
			}
		} catch (error) {
			console.error('Error placing order:', error);
			setAlertMessage(
				'An error occurred while placing your order. Please try again.'
			);
			setShowAlert(true);
		} finally {
			setIsPlacingOrder(false);
		}
	};

	const normalizeDistrict = (district: string): string => {
		const kathmandu_valley = ['kathmandu', 'lalitpur', 'bhaktapur'];
		if (kathmandu_valley.includes(district.toLowerCase())) {
			return 'Kathmandu Valley';
		}
		return district;
	};

	const calculateDeliveryTime = (
		customerDistrict: string,
		vendorDistrict: string
	): string => {
		const normalizedCustomerDistrict = normalizeDistrict(customerDistrict);
		const normalizedVendorDistrict = normalizeDistrict(vendorDistrict);

		if (normalizedCustomerDistrict === normalizedVendorDistrict) {
			return '1-2 days';
		} else {
			return '3-5 days';
		}
	};

	const getOverallDeliveryTime = (): string => {
		if (!billingDetails.district || vendorGroups.length === 0) {
			return '3-5 days';
		}

		const deliveryTimes = vendorGroups.map((group) =>
			calculateDeliveryTime(billingDetails.district, group.vendorDistrict)
		);

		// If any vendor requires 3-5 days, the overall delivery is 3-5 days
		if (deliveryTimes.some((time) => time === '3-5 days')) {
			return '3-5 days';
		}
		return '1-2 days';
	};

	const [vendorCache, setVendorCache] = useState<{
		[key: number]: { businessName: string; district: { name: string } };
	}>({});

	useEffect(() => {
		const fetchVendorDetails = async (vendorId: number) => {
			if (!vendorCache[vendorId]) {
				try {
					const response = await fetch(
						`${API_BASE_URL}/api/vendors/${vendorId}`,
						{
							headers: token ? { Authorization: `Bearer ${token}` } : {},
						}
					);
					const result = await response.json();
					if (result.success && result.data) {
						setVendorCache((prev) => ({
							...prev,
							[vendorId]: {
								businessName: result.data.businessName,
								district: result.data.district,
							},
						}));
					}
				} catch (error) {
					console.error(`Error fetching vendor ${vendorId}:`, error);
				}
			}
		};

		cartItems.forEach((item) => {
			if (item.product?.vendorId && !vendorCache[item.product.vendorId]) {
				fetchVendorDetails(item.product.vendorId);
			}
		});
	}, [cartItems, token]);

	const getVendorInfo = (item: CartItem) => {
		if (item.product?.vendorId && vendorCache[item.product.vendorId]) {
			return {
				businessName: vendorCache[item.product.vendorId].businessName,
				district: vendorCache[item.product.vendorId].district.name,
			};
		}
		return {
			businessName: item.product?.vendor?.businessName || 'Unknown Vendor',
			district: item.product?.vendor?.district?.name || 'Unknown District',
		};
	};

	const getCurrentQuantity = (item: CartItem): number => {
		if (location.state?.buyNow) {
			return buyNowQuantities[item.id] || item.quantity;
		}
		return item.quantity;
	};

	const groupItemsByVendor = (): ShippingGroup[] => {
		if (cartItems.length === 0) {
			return [];
		}

		const vendorGroups: { [key: string]: CartItem[] } = {};

		cartItems.forEach((item) => {
			const vendorInfo = getVendorInfo(item);
			const key = `${vendorInfo.businessName}-${vendorInfo.district}`;

			if (!vendorGroups[key]) {
				vendorGroups[key] = [];
			}

			vendorGroups[key].push(item);
		});

		return Object.entries(vendorGroups).map(([key, items]) => {
			const subtotal = items.reduce((sum, item) => {
				const quantity = getCurrentQuantity(item);
				return sum + Number(item.price) * quantity;
			}, 0);

			const vendorInfo = getVendorInfo(items[0]);
			let shippingCost = 0;

			if (billingDetails.district) {
				const customerDistrict = normalizeDistrict(billingDetails.district);
				const normalizedVendorDistrict = normalizeDistrict(vendorInfo.district);
				shippingCost =
					customerDistrict === normalizedVendorDistrict ? 100 : 200;
			}

			const lineTotal = subtotal + shippingCost;

			return {
				vendorDistrict: vendorInfo.district,
				vendorName: vendorInfo.businessName,
				items,
				shippingCost,
				subtotal,
				lineTotal,
			};
		});
	};

	const vendorGroups = groupItemsByVendor();

	const subtotal = cartItems.reduce((sum, item) => {
		const quantity = getCurrentQuantity(item);
		return sum + Number(item.price) * quantity;
	}, 0);

	const totalShipping = vendorGroups.reduce(
		(sum, group) => sum + group.shippingCost,
		0
	);

	const total = subtotal + totalShipping;

	const discountPercentage = appliedPromoCode
		? appliedPromoCode.discountPercentage
		: 0;
	const discountAmount = appliedPromoCode
		? Math.round((total * discountPercentage) / 100)
		: 0;
	const finalTotal = total - discountAmount;

	const getVariantLabel = (item: CartItem): string => {
		const v = item?.variant || item?.selectedVariant || null;
		if (!v) {
			const rootAttrs =
				(item && (item.variantAttributes || item.attributes)) || null;
			return rootAttrs ? formatAttributes(rootAttrs) : '';
		}
		if (typeof v.name === 'string' && v.name.trim()) return v.name.trim();
		const byAttrs = formatAttributes(
			v.attributes || v.attributeValues || v.attributeSpecs || v.attrs || null
		);
		if (byAttrs) return byAttrs;
		if (v.sku) return `SKU: ${String(v.sku)}`;
		return '';
	};

	const formatAttributes = (attrs: any): string => {
		if (!attrs) return '';
		if (Array.isArray(attrs)) {
			const parts = attrs
				.map((a: any) => {
					const label = String(
						a?.type ?? a?.attributeType ?? a?.name ?? ''
					).trim();
					const valuesSrc: any =
						a?.values ?? a?.attributeValues ?? a?.value ?? a?.name ?? [];
					const valuesArr = Array.isArray(valuesSrc) ? valuesSrc : [valuesSrc];
					const valueText = valuesArr
						.map((v: any) =>
							String(
								v && typeof v === 'object'
									? v.value ?? v.name ?? JSON.stringify(v)
									: v
							)
						)
						.filter(Boolean)
						.join('/');
					return label && valueText
						? `${label}: ${valueText}`
						: valueText || '';
				})
				.filter(Boolean);
			return parts.join(', ');
		}
		if (typeof attrs === 'object') {
			const parts = Object.entries(attrs).map(([k, v]) => {
				const label = String(k).trim();
				const valueText = Array.isArray(v)
					? v.map((x: any) => String(x?.value ?? x?.name ?? x)).join('/')
					: String((v as any)?.value ?? (v as any)?.name ?? v);
				return `${label}: ${valueText}`;
			});
			return parts.join(', ');
		}
		return String(attrs);
	};

	const handleIncrease = (item: CartItem) => {
		if (location.state?.buyNow) {
			const currentQty = buyNowQuantities[item.id] || item.quantity;
			const stock = item.variant?.stock ?? Infinity;
			if (currentQty + 1 > stock) {
				setAlertMessage('Failed to update quantity. Stock limit reached.');
				setShowAlert(true);
				return;
			}
			setBuyNowQuantities((prev) => ({
				...prev,
				[item.id]: currentQty + 1,
			}));
		} else {
			handleIncreaseQuantity(item.id, 1);
		}
	};

	const handleDecrease = (item: CartItem) => {
		if (location.state?.buyNow) {
			const currentQty = buyNowQuantities[item.id] || item.quantity;
			if (currentQty > 1) {
				setBuyNowQuantities((prev) => ({
					...prev,
					[item.id]: currentQty - 1,
				}));
			} else {
				setAlertMessage('Quantity cannot be less than 1.');
				setShowAlert(true);
			}
		} else {
			handleDecreaseQuantity(item.id, 1);
		}
	};

	// useEffect(() => {
	//   const fetchPromoCodes = async () => {
	//     try {
	//       const response = await fetch(`${API_BASE_URL}/api/promo`);
	//       const result = await response.json();
	//       if (result.success && result.data) {
	//         setPromoCodes(result.data);
	//       }
	//     } catch (error) {
	//       console.error('Error fetching promo codes:', error);
	//     }
	//   };
	//   fetchPromoCodes();
	// }, []);

	return (
		<>
			<Navbar />
			{/* <AlertModal open={showAlert} message={alertMessage} onClose={() => setShowAlert(false)} /> */}
			{showAlert && alertMessage.includes('Your order has been placed') ? (
				<OrderSuccessModal
					open={showAlert}
					onClose={() => setShowAlert(false)}
					onViewOrder={() => {
						navigate('/user-profile', { state: { activeTab: 'orders' } });
						setShowAlert(false);
					}}
					onContinueShopping={() => {
						navigate('/shop');
						setShowAlert(false);
					}}
					totalAmount={finalTotal}
					paymentMethod={selectedPaymentMethod}
				/>
			) : (
				<AlertModal
					open={showAlert}
					message={alertMessage}
					onClose={() => setShowAlert(false)}
				/>
			)}

			<form
				id="esewa-form"
				action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
				method="POST"
				style={{ display: 'none' }}
			>
				<input
					type="hidden"
					name="amount"
					value={formData.amount}
				/>
				<input
					type="hidden"
					name="tax_amount"
					value={formData.tax_amount}
				/>
				<input
					type="hidden"
					name="total_amount"
					value={formData.total_amount}
				/>
				<input
					type="hidden"
					name="transaction_uuid"
					value={formData.transaction_uuid}
				/>
				<input
					type="hidden"
					name="product_code"
					value={formData.product_code}
				/>
				<input
					type="hidden"
					name="product_service_charge"
					value={formData.product_service_charge}
				/>
				<input
					type="hidden"
					name="product_delivery_charge"
					value={formData.product_delivery_charge}
				/>
				<input
					type="hidden"
					name="success_url"
					value={formData.success_url}
				/>
				<input
					type="hidden"
					name="failure_url"
					value={formData.failure_url}
				/>
				<input
					type="hidden"
					name="signed_field_names"
					value={formData.signed_field_names}
				/>
				<input
					type="hidden"
					name="signature"
					value={formData.signature}
				/>
			</form>

			{showAlert &&
				alertMessage &&
				selectedPaymentMethod === 'CASH_ON_DELIVERY' && (
					<div className="checkout-container__alert">
						<span
							role="img"
							aria-label="success"
							style={{ fontSize: '1.5em', marginRight: '0.5em' }}
						>
							✓
						</span>
						{alertMessage}
					</div>
				)}

			<div className="checkout-container">
				<h2>Billing Details</h2>
				<div className="checkout-container__content">
					<div className="checkout-container__billing-details">
						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">
								Full Name *
							</label>
							<input
								type="text"
								name="fullName"
								value={billingDetails.fullName}
								onChange={handleInputChange}
								onBlur={handleBlur}
								placeholder="Enter your Full Name"
								className={`checkout-container__form-group-input ${
									errors.fullName && touched.fullName ? 'error' : ''
								}`}
								required
							/>
							{errors.fullName && touched.fullName && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.fullName}
								</div>
							)}
						</div>

						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">
								Province *
							</label>
							<select
								name="province"
								value={billingDetails.province}
								onChange={handleInputChange}
								onBlur={handleBlur}
								className={`checkout-container__form-group-select ${
									errors.province && touched.province ? 'error' : ''
								}`}
								required
							>
								<option value="">Select Province</option>
								{provinceData.map((p) => (
									<option
										key={p}
										value={p}
									>
										{p}
									</option>
								))}
							</select>
							{errors.province && touched.province && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.province}
								</div>
							)}
						</div>

						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">
								District *
							</label>
							<select
								name="district"
								value={billingDetails.district}
								onChange={handleInputChange}
								onBlur={handleBlur}
								className={`checkout-container__form-group-select ${
									errors.district && touched.district ? 'error' : ''
								}`}
								required
							>
								<option value="">Select District</option>
								{districtData.map((district) => (
									<option
										key={district}
										value={district}
									>
										{district}
									</option>
								))}
							</select>
							{errors.district && touched.district && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.district}
								</div>
							)}
						</div>

						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">City *</label>
							<input
								type="text"
								name="city"
								value={billingDetails.city}
								onChange={handleInputChange}
								onBlur={handleBlur}
								placeholder="Enter your city"
								className={`checkout-container__form-group-input ${
									errors.city && touched.city ? 'error' : ''
								}`}
								required
							/>
							{errors.city && touched.city && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.city}
								</div>
							)}
						</div>

						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">
								Street Address *
							</label>
							<input
								type="text"
								name="streetAddress"
								value={billingDetails.streetAddress}
								onChange={handleInputChange}
								onBlur={handleBlur}
								placeholder="Enter your street address"
								className={`checkout-container__form-group-input ${
									errors.streetAddress && touched.streetAddress ? 'error' : ''
								}`}
								required
							/>
							{errors.streetAddress && touched.streetAddress && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.streetAddress}
								</div>
							)}
						</div>

						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">
								Landmark{' '}
							</label>
							<input
								type="text"
								name="landmark"
								value={billingDetails.landmark}
								onChange={handleInputChange}
								onBlur={handleBlur}
								placeholder="Enter Nearest Landmark (Eg: Apartments, Hospital, School etc)"
								className={`checkout-container__form-group-input ${
									errors.landmark && touched.landmark ? 'error' : ''
								}`}
							/>
							{errors.landmark && touched.landmark && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.landmark}
								</div>
							)}
						</div>

						<div className="checkout-container__form-group">
							<label className="checkout-container__form-label">
								Phone Number *
							</label>
							<input
								type="tel"
								name="phoneNumber"
								value={billingDetails.phoneNumber}
								onChange={handleInputChange}
								onBlur={handleBlur}
								placeholder="9xxxxxxxxx"
								className={`checkout-container__form-group-input ${
									errors.phoneNumber && touched.phoneNumber ? 'error' : ''
								}`}
								maxLength={10}
								required
							/>
							{errors.phoneNumber && touched.phoneNumber && (
								<div className="error-message">
									<FaInfoCircle className="error-icon" />
									{errors.phoneNumber}
								</div>
							)}
						</div>

						<div className="checkout-container__promo-section-left">
							<h3 style={{ marginBottom: '1rem', color: '#333' }}>
								Have a Promo Code?
							</h3>
							{!showPromoField ? (
								<button
									type="button"
									className="checkout-container__promo-button-left"
									onClick={() => setShowPromoField(true)}
									style={{
										backgroundColor: '#ff6b35',
										color: 'white',
										border: 'none',
										padding: '12px 24px',
										borderRadius: '8px',
										fontSize: '16px',
										fontWeight: '600',
										cursor: 'pointer',
										transition: 'all 0.3s ease',
										boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
										width: '100%',
										maxWidth: '300px',
									}}
								>
									Apply Promo Code
								</button>
							) : (
								<div className="checkout-container__promo-input-section-left">
									<div
										className="checkout-container__promo-input-container-left"
										style={{
											display: 'flex',
											gap: '10px',
											marginBottom: '10px',
										}}
									>
										<input
											type="text"
											placeholder="Enter your promo code"
											value={enteredPromoCode}
											onChange={(e) => setEnteredPromoCode(e.target.value)}
											style={{
												flex: 1,
												padding: '12px',
												border: '2px solid #ddd',
												borderRadius: '6px',
												fontSize: '16px',
												outline: 'none',
												transition: 'border-color 0.3s ease',
											}}
										/>
										<button
											type="button"
											onClick={handleApplyPromoCode}
											style={{
												backgroundColor: '#ff6b35',
												color: 'white',
												border: 'none',
												padding: '12px 20px',
												borderRadius: '6px',
												fontSize: '16px',
												fontWeight: '600',
												cursor: 'pointer',
												transition: 'all 0.3s ease',
												boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
											}}
										>
											Apply
										</button>
									</div>
									{promoError && (
										<span
											style={{
												color: 'red',
												fontSize: '0.9rem',
												display: 'block',
											}}
										>
											❌ {promoError}
										</span>
									)}
								</div>
							)}
							{appliedPromoCode && (
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										backgroundColor: '#f0f9ff',
										border: '2px solid #22c55e',
										borderRadius: '8px',
										padding: '12px',
										marginTop: '15px',
									}}
								>
									<span
										style={{
											color: '#22c55e',
											fontSize: '16px',
											fontWeight: '600',
										}}
									>
										✓ "{appliedPromoCode.promoCode}" applied (
										{appliedPromoCode.discountPercentage}% off)
									</span>
									<button
										type="button"
										onClick={handleRemovePromoCode}
										style={{
											backgroundColor: '#ef4444',
											color: 'white',
											border: 'none',
											padding: '6px 12px',
											borderRadius: '4px',
											fontSize: '12px',
											cursor: 'pointer',
											transition: 'background-color 0.3s ease',
										}}
									>
										Remove
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="checkout-container__order-summary">
						<h3 className="checkout-container__order-summary-heading">
							Your Order
						</h3>
						<div className="checkout-container__order-details">
							<h4 className="checkout-container__order-details-heading">
								Product details
							</h4>
							{cartItems.length > 0 ? (
								vendorGroups.map((group, groupIndex) => (
									<div
										key={groupIndex}
										className="checkout-container__vendor-group"
									>
										<div className="checkout-container__vendor-info">
											<h5 className="checkout-container__vendor-name">
												Vendor: {group.vendorName}
											</h5>
											<p className="checkout-container__vendor-location">
												Location: {group.vendorDistrict}
											</p>
										</div>
										{group.items.map((item) => (
											<div
												key={item.id}
												className="checkout-container__product-item"
											>
												<img
													src={item.image || logo}
													alt={item.name}
													className="checkout-container__product-item-img"
												/>
												<div className="checkout-container__product-info">
													<span className="checkout-container__product-info-text">
														{item.name}
													</span>
													{(() => {
														const label = getVariantLabel(item);
														return label ? (
															<small
																style={{
																	display: 'block',
																	color: '#666',
																	marginTop: 4,
																}}
															>
																Variant: {label}
															</small>
														) : null;
													})()}
													<div className="checkout-container__quantity-controls">
														<button
															className="checkout-container__quantity-controls-button"
															onClick={() => handleDecrease(item)}
														>
															-
														</button>
														<span>{getCurrentQuantity(item)}</span>
														<button
															className="checkout-container__quantity-controls-button"
															onClick={() => handleIncrease(item)}
														>
															+
														</button>
													</div>
												</div>
												<span className="checkout-container__product-price">
													Rs{' '}
													{(
														Number(item.price) * getCurrentQuantity(item)
													).toLocaleString()}
												</span>
											</div>
										))}
										<div className="checkout-container__group-summary">
											<div className="checkout-container__group-subtotal">
												<span>Linetotal ({group.vendorName}):</span>
												<span>Rs {group.subtotal.toLocaleString()}</span>
											</div>
											{billingDetails.district && (
												<div className="checkout-container__group-shipping">
													<span>Shipping from {group.vendorDistrict}:</span>
													<span className="checkout-container__shipping-cost">
														Rs {group.shippingCost.toLocaleString()}
														{normalizeDistrict(billingDetails.district) ===
															normalizeDistrict(group.vendorDistrict) && (
															<small> (Same district)</small>
														)}
													</span>
													<div className="checkout-container__delivery-time">
														<small>
															Delivery:{' '}
															{calculateDeliveryTime(
																billingDetails.district,
																group.vendorDistrict
															)}
														</small>
													</div>
												</div>
											)}
											<div className="checkout-container__group-line-total">
												<span>
													<strong>Sub Total ({group.vendorName}):</strong>
												</span>
												<span>
													<strong>Rs {group.lineTotal.toLocaleString()}</strong>
												</span>
											</div>
										</div>
									</div>
								))
							) : (
								<p>No items in cart.</p>
							)}

							<div className="checkout-container__order-total">
								<span>Sub Total:</span>
								<span>Rs {subtotal.toLocaleString()}</span>
							</div>

							{billingDetails.district && (
								<div className="checkout-container__order-total">
									<span>Total Shipping:</span>
									<span>Rs {totalShipping.toLocaleString()}</span>
								</div>
							)}

							{appliedPromoCode && (
								<div className="checkout-container__order-total">
									<span>Discount ({discountPercentage}%):</span>
									<span style={{ color: 'green' }}>
										- Rs {discountAmount.toLocaleString()}
									</span>
								</div>
							)}

							<div className="checkout-container__order-total--total">
								<span>Total Price</span>
								<span>Rs {finalTotal.toLocaleString()}</span>
							</div>
						</div>

						<div className="checkout-container__payment-methods">
							{availablePaymentMethods.map((method) => (
								<label
									key={method.id}
									className={`checkout-container__payment-methods-label ${
										selectedPaymentMethod === method.id ? 'selected' : ''
									} ${method.disabled ? 'disabled' : ''}`}
								>
									<input
										type="radio"
										name="payment"
										value={method.id}
										className="checkout-container__payment-methods-input"
										checked={selectedPaymentMethod === method.id}
										onChange={
											!method.disabled ? handlePaymentMethodChange : undefined
										}
										disabled={method.disabled}
									/>
									<span className="checkout-container__payment-methods-label-text">
										{method.name}
									</span>

									{method.disabled && (
										<p className="checkout-container__payment-methods-message">
											{method.message}
										</p>
									)}
								</label>
							))}
						</div>

						<p className="checkout-container__privacy-note">
							Your personal data will be used to process your order, support
							your experience throughout this website, and for other purposes
							described in our privacy policy.
						</p>

						{/* Updated Terms Checkbox - Removed onClick from label, rely on input's onChange */}
						<label
							className="checkout-container__terms-checkbox"
							htmlFor="terms-checkbox"
						>
							<input
								id="terms-checkbox"
								type="checkbox"
								checked={termsAgreed}
								onChange={handleTermsChange} // This handler updates the state
								className="checkout-container__terms-checkbox-input"
								required
								style={{ display: 'none' }} // Hide the default checkbox
							/>
							<span className="checkout-container__terms-checkbox-label">
								<span className="checkout-container__terms-checkbox-text">
									I have read and agree to the website{' '}
									<Link
										to="/terms"
										rel="noopener noreferrer"
									>
										terms and conditions
									</Link>{' '}
									*
								</span>
							</span>
						</label>

						{errors.terms && !termsAgreed && (
							<div className="error-message">
								<FaInfoCircle className="error-icon" />
								{errors.terms}
							</div>
						)}

						<button
							className={`checkout-container__place-order-btn${
								!termsAgreed || isPlacingOrder ? '--disabled' : ''
							}`}
							disabled={!termsAgreed || isPlacingOrder}
							onClick={handlePlaceOrder}
						>
							{isPlacingOrder ? (
								<span className="checkout-container__loading-text">
									Placing Order
									<span className="checkout-container__animated-ellipsis">
										...
									</span>
								</span>
							) : (
								'Place Order'
							)}
						</button>
					</div>
				</div>
			</div>
			<Footer />
		</>
	);
};

export default Checkout;
