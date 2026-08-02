/* ==========================================================================
   PRODUCT CARD (ProductCard1)
   --------------------------------------------------------------------------
   
   Shared component used in:
   - Shop Page
   - Vendor Product Page
   - Recommend product 
   ========================================================================== */

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FaCartPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { makeWishlistKey, useWishlist } from "../context/WishlistContext";
import defaultProductImage from "../assets/logo.webp";
import star from "../assets/star.png";
import AuthModal from "../Components/AuthModal";
import AgeRestrictionModal from "../Components/AgeRestrictionModal";
import { Product } from "../Components/Types/Product";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { getAgeDecision, saveAgeDecision, startAgeGateVisit } from "../utils/ageRestrictionSession";
import { getProductPrimaryImage } from '../utils/getProductPrimaryImage';
import { getDiscountDisplay } from "../utils/priceDisplay";
import "../ALT/ProductCartd1.css";

interface ProductCardProps {
	product: Product;
}

const Product1: React.FC<ProductCardProps> = ({ product }) => {
	const { handleCartOnAdd } = useCart();
	const { token, isAuthenticated } = useAuth();
	const {
		isWishlisted: hasWishlistItem,
		getWishlistItem,
		addWishlistItem,
		removeWishlistItem,
		pendingKeys,
	} = useWishlist();
	const { cartOpen } = useUI();
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [showAgeModal, setShowAgeModal] = useState(false);
	const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);


	const {
		title,
		description,
		rating,
		ratingCount,
		isBestSeller,
		id,
	} = product;



	const displayImage = imageError
		? defaultProductImage
		: getProductPrimaryImage(product, defaultProductImage);

	const availableVariants = (product.variants || []).filter(
		(variant) =>
			Number(variant.stock || 0) > 0 && variant.status !== "OUT_OF_STOCK"
	);
	const selectedCardVariant =
		product.hasVariants && availableVariants.length > 0
			? availableVariants[0]
			: product.variants?.[0];
	const displayStock = product.hasVariants
		? (product.variants || []).reduce(
				(total, variant) => total + Number(variant.stock || 0),
				0
			)
		: Number(product.stock || product.piece || 0);
	const isOutOfStock =
		product.status === "OUT_OF_STOCK" ||
		(product.hasVariants
			? availableVariants.length === 0
			: displayStock <= 0);
	const wishlistVariantId = product.hasVariants ? selectedCardVariant?.id : undefined;
	// Single source of truth: WishlistContext, so every card/page reflects the
	// same state instantly instead of each component tracking its own copy.
	const isWishlisted = hasWishlistItem(id, wishlistVariantId);
	const wishlistPending = pendingKeys.has(makeWishlistKey(id, wishlistVariantId));

	const handleImageError = () => {
		setImageError(true);
	};

	const minimumAge = product.ageRestriction?.minimumAge ?? 18;
	// Re-prompt on every card mount for a restricted product, mirroring the
	// product details page: startAgeGateVisit clears the stored session decision
	// so a previous accept/decline never suppresses the next visit. The modal is
	// only opened by the action handlers below, never automatically on mount.
	useEffect(() => {
		if (product.ageRestriction?.isRestricted) {
			startAgeGateVisit(minimumAge);
		}
	}, [minimumAge, product.ageRestriction?.isRestricted]);
	// Gates purchase actions only (never the card link). A declined decision
	// is never a hard stop — it just re-opens the modal so the user can still
	// confirm later instead of silently doing nothing.
	const requestAgeConfirmation = (action: () => void) => {
		const decision = product.ageRestriction?.isRestricted
			? getAgeDecision(minimumAge)
			: "accepted";
		if (decision === "accepted") {
			action();
			return;
		}
		setPendingAction(() => action);
		setShowAgeModal(true);
	};


	const handleWishlist = async () => {
		if (!isAuthenticated) {
			setAuthModalOpen(true);
			return;
		}
		if (wishlistPending) return;

		// Removing is never age-gated; only adding a restricted product is, and
		// the prompt shows BEFORE the add (never a silent skip, never deferred
		// to the wishlist page).
		if (isWishlisted) {
			try {
				const item = getWishlistItem(id, wishlistVariantId);
				if (item?.id) {
					await removeWishlistItem(item.id);
					toast.success("Removed from wishlist");
				}
			} catch (e: any) {
				const status = e?.response?.status;
				const msg: string =
					e?.response?.data?.message ||
					e?.response?.data?.error ||
					e?.message ||
					"";

				if (status === 409 || /already/i.test(msg)) {
					toast("Already present in the wishlist");
				} else {
					toast.error("Failed to remove from wishlist");
					console.error("Wishlist operation failed:", e);
				}
			}
			return;
		}

		requestAgeConfirmation(async () => {
			try {
				const addedItem = await addWishlistItem(id, wishlistVariantId);
				if (addedItem !== null) {
					toast.success("Added to wishlist");
				}
			} catch (e: any) {
				const status = e?.response?.status;
				const msg: string =
					e?.response?.data?.message ||
					e?.response?.data?.error ||
					e?.message ||
					"";

				if (status === 409 || /already/i.test(msg)) {
					toast("Already present in the wishlist");
				} else {
					toast.error("Failed to add to wishlist");
					console.error("Wishlist operation failed:", e);
				}
			}
		});
	};


	// Price Determination (Aligned with backend source of truth)
	const getDisplayPrices = () => {
		if (product.hasVariants && product.variants?.length) {
			const validVariants = product.variants
				.filter(v => Number(v.stock || 0) > 0 && v.status !== "OUT_OF_STOCK")
				.map(v => {
					const base = Number((v as any).basePrice ?? v.price) || 0;
					const final = Number(v.finalPrice) || base;
					return {
						base,
						final,
						savings: Math.max(0, base - final),
						discount: v.discount !== undefined ? v.discount : product.discount,
						discountAmount: v.discountAmount !== undefined ? v.discountAmount : product.discountAmount,
						discountPercent: v.discountPercent !== undefined ? v.discountPercent : product.discountPercent,
						discountType: v.discountType !== undefined ? v.discountType : product.discountType
					};
				});

			if (validVariants.length > 0) {
				// Prefer a discounted variant (biggest savings) over the merely
				// cheapest one, so the badge shows whenever any variant is on
				// sale — not only when the cheapest variant happens to be.
				const discounted = validVariants.filter(v => v.savings > 0);
				const chosen = discounted.length > 0
					? discounted.reduce((best, curr) => curr.savings > best.savings ? curr : best)
					: validVariants.reduce((prev, curr) => curr.final < prev.final ? curr : prev);
				return { base: chosen.base, final: chosen.final, discount: chosen.discount , discountAmount: chosen.discountAmount, discountPercent: chosen.discountPercent, discountType: chosen.discountType };
			}
		}

		return {
			base: Number(product.basePrice) || 0,
			final: Number(product.finalPrice) || (Number(product.basePrice) || 0),
			discount: product.discount,
			discountAmount: product.discountAmount,
			discountPercent: product.discountPercent,
			discountType: product.discountType
		};
	};

	const { base: basePrice, final: finalPrice, discount, discountAmount, discountPercent, discountType } = getDisplayPrices();

	// Same shared utility used on product details/cart/checkout, so the
	// badge/savings shown here never disagrees with those pages.
	const discountDisplay = getDiscountDisplay({
		basePrice,
		finalPrice,
		discount,
		discountAmount,
		discountPercent,
		discountType,
	});
	const savingPrice = discountDisplay.hasDiscount
		? discountDisplay.savingsAmount.toFixed(2)
		: null;


	return (
		<>
		<Link
			to={`/product-page/${product.id}`}
			className="product1__link-wrapper"
		>
			<div className="product1">
				{isOutOfStock && <span className="product1__stock-badge">Out of stock</span>}
				<div className="product1__header">
					<button
						className="product1__wishlist-button"
						aria-label={
							isWishlisted ? "Remove from wishlist" : "Add to wishlist"
						}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleWishlist();
						}}
						disabled={wishlistPending}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill={isWishlisted ? "red" : "none"}
							stroke={isWishlisted ? "red" : "currentColor"}
							strokeWidth="2"
						>
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
						</svg>
					</button>
					{isBestSeller && <span className="product1__tag">Best seller</span>}
					{discountDisplay.badgeLabel && (
						<span className="product1__discount-badge">
							{discountDisplay.badgeLabel}
						</span>
					)}
				</div>

				<div className="product1__image">
					<img
						src={displayImage}
						alt={title || "Product image"}
						onError={handleImageError}
						loading="lazy"
					/>
					<button
						type="button"
						className="product1__cart-button"
						disabled={isOutOfStock}
						aria-label={isOutOfStock ? "Out of stock" : "Add to cart"}
						title={isOutOfStock ? "Out of stock" : "Add to cart"}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							if (isOutOfStock) return;
							if (!token) {
								setAuthModalOpen(true);
								return;
							}
							requestAgeConfirmation(() =>
								handleCartOnAdd(
									product,
									1,
									product.hasVariants ? selectedCardVariant?.id : undefined
								)
							);
						}}
					>
						<FaCartPlus
						/>
					</button>
				</div>

				<div className="product1__rating">
					<div className="product1__rating-info">
						<span className="product1__rating-star">
							<img
								src={star}
								alt="Rating"
							/>
						</span>
						<span className="product1__rating-score">{rating} |</span>
						<span className="product1__rating-count">({ratingCount})</span>
					</div>
				</div>
				<div className="product1__info">
					<h3
						className="product1__title"
						data-full-title={title}
						title={title}
					>
						{title}
					</h3>
					{description && (
						<p className="product1__description">{description}</p>
					)}
					<div 
						className="product1__price"
						style={
							finalPrice >= 10000
								? { flexDirection: "column", alignItems: "flex-start", gap: "2px" }
								: undefined
						}
					>
						<span className="product1__current-price">
							Rs {finalPrice?.toLocaleString()}
						</span>

						{savingPrice && (
							<div 
								className="product1__price-details"
								style={{
									display: "flex",
									alignItems: "center",
									gap: "6px",
									flexWrap: "wrap",
									rowGap: "2px"
								}}
							>
								<span className="product1__original-price" style={{ marginLeft: 0 }}>
									Rs {basePrice?.toLocaleString()}
								</span>
								<span className="product1__discount">
									Save Rs {savingPrice}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</Link>
		<AuthModal
			isOpen={authModalOpen}
			onClose={(e?: React.MouseEvent) => {
				e?.stopPropagation();
				setAuthModalOpen(false);
			}}
		/>
		{showAgeModal && (
			<AgeRestrictionModal
				minimumAge={minimumAge}
				message={product.ageRestriction?.restrictionMessage ?? undefined}
				onConfirm={() => {
					saveAgeDecision(minimumAge, "accepted");
					setShowAgeModal(false);
					pendingAction?.();
					setPendingAction(null);
				}}
				onDecline={() => {
					saveAgeDecision(minimumAge, "declined");
					setShowAgeModal(false);
					setPendingAction(null);
				}}
			/>
		)}
		</>
	);
};

export default Product1;
