/* ==========================================================================
   PRODUCT CARD (ProductCard1)
   --------------------------------------------------------------------------
   
   Shared component used in:
   - Shop Page
   - Vendor Product Page
   - Recommend product 
   ========================================================================== */

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaCartPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import {
	addToWishlist,
	removeFromWishlist,
	getWishlist,
} from "../api/wishlist";
import defaultProductImage from "../assets/logo.webp";
import star from "../assets/star.png";
import AuthModal from "../Components/AuthModal";
import { Product } from "../Components/Types/Product";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";
import "../ALT/ProductCartd1.css";

interface ProductCardProps {
	product: Product;
}

const Product1: React.FC<ProductCardProps> = ({ product }) => {
	const { handleCartOnAdd } = useCart();
	const { token, isAuthenticated } = useAuth();
	const { cartOpen } = useUI();
	const [wishlistLoading, setWishlistLoading] = useState(false);
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [isWishlisted, setIsWishlisted] = useState(false);
	const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);

	const {
		title,
		description,
		price,
		originalPrice,
		discount,
		rating,
		ratingCount,
		isBestSeller,
		id,
	} = product;

	const displayImage = imageError
		? defaultProductImage
		: getProductPrimaryImage(product, defaultProductImage);

	// Check if product is already in wishlist when component mounts or auth changes
	useEffect(() => {
		const checkWishlistStatus = async () => {
			if (isAuthenticated && token) {
				try {
					const wishlistItems = await getWishlist(token);
					const variantCount = product.variants?.length || 0;
					const variantId =
						variantCount > 0 ? product.variants![0].id : undefined;

					const wishlistItem = wishlistItems.find((item: any) => {
						const productMatch =
							item.productId === id || item.product?.id === id;
						const variantMatch = variantId
							? item.variantId === variantId || item.variant?.id === variantId
							: !item.variantId && !item.variant?.id;

						return productMatch && variantMatch;
					});

					if (wishlistItem) {
						setIsWishlisted(true);
						setWishlistItemId(wishlistItem.id);
					} else {
						setIsWishlisted(false);
						setWishlistItemId(null);
					}
				} catch (error) {
					console.warn("Failed to check wishlist status:", error);
					setIsWishlisted(false);
					setWishlistItemId(null);
				}
			} else {
				setIsWishlisted(false);
				setWishlistItemId(null);
			}
		};

		checkWishlistStatus();
	}, [id, product.variants, isAuthenticated, token]);

	const handleImageError = () => {
		setImageError(true);
	};

	// Compute display price: if product price is null/0, fall back to first variant's price
	const toNumber = (v: any): number => {
		if (v === undefined || v === null) return 0;
		const n = typeof v === "string" ? parseFloat(v) : Number(v);
		return isFinite(n) ? n : 0;
	};

	const calculatePrice = (base: any, disc?: any, discType?: string): number => {
		const baseNum = toNumber(base);
		if (!disc || !discType) return baseNum;
		const d = typeof disc === "string" ? parseFloat(disc) : Number(disc);
		if (!isFinite(d)) return baseNum;
		if (discType === "PERCENTAGE") return baseNum * (1 - d / 100);
		if (discType === "FIXED" || discType === "FLAT") return baseNum - d;
		return baseNum;
	};

	let displayPriceNum = 0;
	const productPriceNum = toNumber(price as any);
	if (
		(price === null || price === undefined || productPriceNum === 0) &&
		(product.variants?.length || 0) > 0
	) {
		const first = product.variants![0] as any;
		const variantBase =
			first?.price ??
			first?.originalPrice ??
			first?.basePrice ??
			product.basePrice ??
			product.price;
		if (
			typeof first?.calculatedPrice === "number" &&
			isFinite(first.calculatedPrice)
		) {
			displayPriceNum = first.calculatedPrice as number;
		} else if (first?.discount && first?.discountType) {
			displayPriceNum = calculatePrice(
				variantBase,
				first.discount,
				String(first.discountType)
			);
		} else if (product.discount && product.discountType) {
			displayPriceNum = calculatePrice(
				variantBase,
				product.discount as any,
				String(product.discountType)
			);
		} else {
			displayPriceNum = toNumber(variantBase);
		}
	} else {
		displayPriceNum = productPriceNum;
	}

	// Remove .00 if it's a whole number
	const formatPrice = (price: number): string => {
		return price % 1 === 0
			? `Rs. ${price.toFixed(0)}`
			: `Rs. ${price.toFixed(2)}`;
	};

	const displayPrice = formatPrice(displayPriceNum);

	// Check if original price should be shown (only if there's a discount or original price differs)
	const originalPriceNum = toNumber(originalPrice);
	const showOriginalPrice =
		originalPrice &&
		discount &&
		Number(discount) > 0 &&
		originalPriceNum !== displayPriceNum;
	const formattedOriginalPrice = showOriginalPrice
		? formatPrice(originalPriceNum)
		: "";

	const handleWishlist = async () => {
		if (!isAuthenticated) {
			setAuthModalOpen(true);
			return;
		}

		setWishlistLoading(true);
		try {
			const variantCount = product.variants?.length || 0;
			const variantId = variantCount > 0 ? product.variants![0].id : undefined;

			if (isWishlisted && wishlistItemId) {
				// Remove from wishlist
				await removeFromWishlist(wishlistItemId, token);
				toast.success("Removed from wishlist");
				setIsWishlisted(false);
				setWishlistItemId(null);
			} else {
				// Add to wishlist
				const addedItem = await addToWishlist(id, variantId, token);
				toast.success("Added to wishlist");
				setIsWishlisted(true);
				setWishlistItemId(addedItem?.id || null);
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
				setIsWishlisted(true);
				// Try to get the wishlist item ID if we don't have it
				if (!wishlistItemId) {
					try {
						const wishlistItems = await getWishlist(token);
						const wishlistItem = wishlistItems.find((item: any) => {
							const productMatch =
								item.productId === id || item.product?.id === id;
							const variantMatch = variantId
								? item.variantId === variantId || item.variant?.id === variantId
								: !item.variantId && !item.variant?.id;

							return productMatch && variantMatch;
						});

						if (wishlistItem) {
							setWishlistItemId(wishlistItem.id);
						}
					} catch (getError) {
						console.warn("Failed to get wishlist item ID:", getError);
					}
				}
			} else {
				toast.error(
					isWishlisted
						? "Failed to remove from wishlist"
						: "Failed to add to wishlist"
				);
				console.error("Wishlist operation failed:", e);
			}
		} finally {
			setWishlistLoading(false);
		}
	};

	return (
		<Link
			to={`/product-page/${product.id}`}
			className="product1__link-wrapper"
		>
			<div className="product1">
				<div className="product1__header">
					{!cartOpen && (
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
							disabled={wishlistLoading}
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
					)}
					{isBestSeller && <span className="product1__tag">Best seller</span>}
				</div>
				{!cartOpen ? (
					<div className="product1__image">
						<img
							src={displayImage}
							alt={title || "Product image"}
							onError={handleImageError}
							loading="lazy"
						/>
						{!cartOpen && (
							<div className="product1__cart-button">
								<FaCartPlus
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										if (!token) {
											setAuthModalOpen(true);
											return;
										}
										const variantCount = product.variants?.length || 0;
										const variantId =
											variantCount > 0 ? product.variants![0].id : undefined;
										handleCartOnAdd(product, 1, variantId);
									}}
								/>
							</div>
						)}
					</div>
				) : (
					<div className="product1__image--skeleton">
						<div className="product1__skeleton-box"></div>
					</div>
				)}
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
					<div className="product1__price">
						<div className="product1__price-row">
							<span className="product1__current-price">{displayPrice}</span>
							{discount && Number(discount) > 0 && (
								<span className="product1__discount">{discount}%</span>
							)}
						</div>
						{showOriginalPrice && (
							<span className="product1__original-price">
								{formattedOriginalPrice}
							</span>
						)}
					</div>
				</div>
			</div>
			<AuthModal
				isOpen={authModalOpen}
				onClose={() => setAuthModalOpen(false)}
			/>
		</Link>
	);
};

export default Product1;
