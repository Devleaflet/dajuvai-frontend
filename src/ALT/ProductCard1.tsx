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
import { addToWishlist, removeFromWishlist } from "../api/wishlist";
import { useWishlist } from "../context/WishlistContext";
import defaultProductImage from "../assets/logo.webp";
import star from "../assets/star.png";
import AuthModal from "../Components/AuthModal";
import { Product } from "../Components/Types/Product";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { getProductPrimaryImage } from '../utils/getProductPrimaryImage';
import "../ALT/ProductCartd1.css";

interface ProductCardProps {
	product: Product;
}

const Product1: React.FC<ProductCardProps> = ({ product }) => {
	const { handleCartOnAdd } = useCart();
	const { token, isAuthenticated } = useAuth();
	const { wishlist, refreshWishlist } = useWishlist();
	const { cartOpen } = useUI();
	const [wishlistLoading, setWishlistLoading] = useState(false);
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [isWishlisted, setIsWishlisted] = useState(false);
	const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);


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

	useEffect(() => {
		if (isAuthenticated && token) {
			const variantCount = product.variants?.length || 0;
			const variantId = variantCount > 0 ? product.variants![0].id : undefined;
			const wishlistItem = wishlist.find((item: any) => {
				const productMatch = item.productId === id || item.product?.id === id;
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
		} else {
			setIsWishlisted(false);
			setWishlistItemId(null);
		}
	}, [wishlist, id, product.variants, isAuthenticated, token]);

	const handleImageError = () => {
		setImageError(true);
	};


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
				await removeFromWishlist(wishlistItemId, token);
				toast.success("Removed from wishlist");
				setIsWishlisted(false);
				setWishlistItemId(null);
				await refreshWishlist();
			} else {
				const addedItem = await addToWishlist(id, variantId, token);
				toast.success("Added to wishlist");
				setIsWishlisted(true);
				setWishlistItemId(addedItem?.id || null);
				await refreshWishlist();
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
				if (!wishlistItemId) {
					await refreshWishlist();
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


	function getProductFinalPrice(product: Product): number | null {
		const normalize = (obj: any): number | null => {
			const price = obj?.finalPrice ?? obj?.basePrice ?? null;
			return price != null && Number(price) > 0 ? Number(price) : null;
		};

		// ✅ No variants → use product price
		if (!product.hasVariants) {
			return normalize(product);
		}

		// ✅ Variants → lowest AVAILABLE variant price
		const validVariants = product.variants?.filter(
			(v) => v && v.status !== "OUT_OF_STOCK" && normalize(v) !== null
		);

		if (!validVariants?.length) return null;

		return Math.min(...validVariants.map(v => normalize(v)!));
	}

	function getProductBasePrice(product: Product): number | null {
		const normalize = (obj: any): number | null => {
			const price = obj?.basePrice ?? obj?.finalPrice ?? null;
			return price != null && Number(price) > 0 ? Number(price) : null;
		};

		// ✅ No variants
		if (!product.hasVariants) {
			return normalize(product);
		}

		// ✅ Variants only
		const validVariants = product.variants?.filter(
			(v) => v && v.status !== "OUT_OF_STOCK" && normalize(v) !== null
		);

		if (!validVariants?.length) return null;

		return Math.min(...validVariants.map(v => normalize(v)!));
	}
	const finalPrice = getProductFinalPrice(product);
	const basePrice = getProductBasePrice(product);
	const savingPrice =
		basePrice != null &&
			finalPrice != null &&
			basePrice > finalPrice
			? (basePrice - finalPrice).toFixed(2)
			: null;


	return (
		<Link
			to={`/product-page/${product.id}`}
			className="product1__link-wrapper"
		>
			<div className="product1">
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
					{isBestSeller && <span className="product1__tag">Best seller</span>}
				</div>

				<div className="product1__image">
					<img
						src={displayImage}
						alt={title || "Product image"}
						onError={handleImageError}
						loading="lazy"
					/>
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
					<div className="product1__price">
						<div className="product1__price-row">
							<span className="product1__current-price">
								Rs {finalPrice?.toLocaleString()}
							</span>

							{savingPrice && (
								<span className="product1__discount">
									Save Rs {savingPrice}
								</span>
							)}
						</div>

						{savingPrice && (
							<span className="product1__original-price">
								Rs {basePrice?.toLocaleString()}
							</span>
						)}
					</div>
				</div>
			</div>
			<AuthModal
				isOpen={authModalOpen}
				onClose={(e?: React.MouseEvent) => {
					e?.stopPropagation();
					setAuthModalOpen(false);
				}}
			/>
		</Link>
	);
};

export default Product1;
