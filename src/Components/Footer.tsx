import "../Styles/Footer.css";
import { TbTruckDelivery } from "react-icons/tb";
import {
	FaPhoneVolume,
	FaLocationDot,
	FaFacebookF,
	FaInstagram,
} from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io";
import esewa from "../assets/esewa.png";
import npx from "../assets/npx.png";
import { Link } from "react-router-dom";
import { useState } from "react";
import OrderTrackingModal from "./Modal/OrderTrackingModal";
import { OrderService } from "../services/orderService";

const Footer: React.FC = () => {
	const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
	const [orderId, setOrderId] = useState("");
	const [email, setEmail] = useState("");
	const [trackingResult, setTrackingResult] = useState<{
		success: boolean;
		orderStatus?: string;
		message?: string;
	} | null>(null);

	const handleTrackOrder = async () => {
		if (!orderId.trim() || !email.trim()) {
			setTrackingResult({
				success: false,
				message: "Please enter both Order ID and Email",
			});
			setIsTrackingModalOpen(true);
			return;
		}
		try {
			const result = await OrderService.trackOrder(parseInt(orderId), email);
			setTrackingResult({
				success: true,
				orderStatus: result.orderStatus,
			});
			setIsTrackingModalOpen(true);
		} catch (error) {
			console.error("Order tracking error:", error);
			setTrackingResult({
				success: false,
				message:
					error instanceof Error
						? error.message
						: "An error occurred while tracking the order",
			});
			setIsTrackingModalOpen(true);
		}
	};

	return (
		<footer className="footer">
			<div className="footer__max-width-container">
				<div className="footer__container">
					{/* First Div: Track Order, Useful Links, Account, Quick Access */}
					<div className="footer__main-content">
						{/* Track Order Section */}
						<div className="footer__section footer__track-section">
							<h2 className="footer__heading">Track your Order</h2>
							<p className="footer__description">
								To track your order please enter your Order ID in the box below
								and press the "Track" button. This was given to you on your
								receipt and in the confirmation email you should have received.
							</p>
							<div className="footer__form">
								<div className="footer__form-row">
									<div className="footer__form-group">
										<label className="footer__label">Order ID</label>
										<p className="footer__hint">
											Found in your order confirmation email
										</p>
										<input
											type="text"
											className="footer__input"
											placeholder="Enter your Order ID"
											value={orderId}
											onChange={(e) => setOrderId(e.target.value)}
										/>
									</div>
									<div className="footer__form-group">
										<label className="footer__label">Billing email</label>
										<p className="footer__hint">Email you used check out.</p>
										<input
											type="email"
											className="footer__input"
											placeholder="Enter your email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>
								</div>
								<button
									className="footer__track-button"
									onClick={handleTrackOrder}
									disabled={!orderId.trim()}
								>
									<span className="button-icon">📦</span>
									Track Order
								</button>
							</div>
						</div>

						{/* Links Sections */}
						<div className="footer__links-wrapper">
							<div className="footer__top-links">
								{/* Useful Links Section */}
								<div className="footer__section footer__links-section">
									<h3 className="footer__section-title">Useful Links</h3>
									<ul className="footer__list">
										<li>
											<Link
												to="/privacy"
												className="footer__link"
											>
												Privacy Policy
											</Link>
										</li>
										<li>
											<Link
												to="/terms"
												className="footer__link"
											>
												Terms & <br />
												Condition
											</Link>
										</li>
										<li>
											<Link
												to="/becomevendor"
												className="footer__link"
											>
												Become a <br />
												vendor
											</Link>
										</li>
										<li>
											<Link
												to="/return-refund-policy"
												className="footer__link"
											>
												Return Policy
											</Link>
										</li>
									</ul>
								</div>

								{/* Quick Access Section */}
								<div className="footer__section footer__links-section">
									<h3 className="footer__section-title">Quick Access</h3>
									<ul className="footer__list">
										<li>
											<Link
												to="/shop"
												className="footer__link"
											>
												Shop
											</Link>
										</li>
										<li>
											<Link
												to="/contact"
												className="footer__link"
											>
												Contact Us
											</Link>
										</li>
										<li>
											<Link
												to="/about"
												className="footer__link"
											>
												About Us
											</Link>
										</li>
										<li>
											<Link
												to="/faq"
												className="footer__link"
											>
												FAQ
											</Link>
										</li>
									</ul>
								</div>

								{/* Account Section */}
								<div className="footer__section footer__account-section">
									<h3 className="footer__section-title">Account</h3>
									<ul className="footer__list">
										<li>
											<Link
												to="/wishlist"
												className="footer__link"
											>
												Wishlist
											</Link>
										</li>
										<li>
											<Link
												to="/contact"
												className="footer__link"
											>
												Complain
											</Link>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Second Div: Three Cards in a Row */}
					<div className="footer__bottom-links-section">
						{/* Services Section */}
						<div className="footer__section footer__services-section">
							<h3 className="footer__section-title">Services</h3>
							<div className="footer__services-list">
								<div className="footer__service-item">
									<div className="footer__service-icon">
										<TbTruckDelivery />
									</div>
									<div className="footer__service-text">
										<div className="footer__service-label">Delivery</div>
										<div className="footer__service-value">All over Nepal</div>
									</div>
								</div>
								<div className="footer__service-item">
									<div className="footer__service-icon">
										<FaPhoneVolume />
									</div>
									<div className="footer__service-text">
										<div className="footer__service-label">Phone</div>
										<div className="footer__service-value">9700620004</div>
									</div>
								</div>
								<div className="footer__service-item">
									<div className="footer__service-icon">
										<FaPhoneVolume />
									</div>
									<div className="footer__service-text">
										<div className="footer__service-label">Landline</div>
										<div className="footer__service-value landline">
											01-4720234
										</div>
									</div>
								</div>
								<div className="footer__service-item">
									<div className="footer__service-icon">
										<FaLocationDot />
									</div>
									<div className="footer__service-text">
										<div className="footer__service-label">Address</div>
										<div className="footer__service-value">
											Kathmandu, Nepal
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Contact With Us Section */}
						<div className="footer__section footer__contact-section">
							<h3 className="footer__section-title">Contact With Us</h3>
							<div className="footer__social-icons">
								<a
									href="https://www.facebook.com/"
									className="footer__social-link"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FaFacebookF />
								</a>
								<a
									href="mailto:Dajuvai106@gmail.com"
									className="footer__social-link"
									target="_blank"
									rel="noopener noreferrer"
								>
									<MdEmail />
								</a>
								<a
									href="https://wa.me/+9779700620004"
									className="footer__social-link"
									target="_blank"
									rel="noooopener noreferrer"
								>
									<IoLogoWhatsapp />
								</a>
								<a
									href="https://www.instagram.com/dajuvai_/"
									className="footer__social-link"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FaInstagram />
								</a>
							</div>
						</div>

						{/* Payment Methods Section */}
						<div className="footer__section footer__payment-section">
							<h3 className="footer__section-title">Payment Methods</h3>
							<div className="footer__payment-icons">
								<img
									src={esewa}
									alt="eSewa Payment"
									className="footer__payment-image"
								/>
								<img
									src={npx}
									alt="NPX Payment"
									className="footer__payment-image"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Copyright Section */}
				<div className="footer__bottom">
					<div className="footer__copyright">
						Copyright Dajuvai © 2025 
					</div>
				</div>
			</div>

			{/* Order Tracking Modal */}
			<OrderTrackingModal
				isOpen={isTrackingModalOpen}
				onClose={() => setIsTrackingModalOpen(false)}
				trackingResult={trackingResult}
			/>
		</footer>
	);
};

export default Footer;
