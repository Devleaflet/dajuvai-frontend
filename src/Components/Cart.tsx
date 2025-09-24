// Cart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
	FaTimes,
	FaShoppingBag,
	FaPlus,
	FaMinus,
	FaTrash,
	FaExclamationCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import "../Styles/Cart.css";

interface CartProps {
	cartOpen: boolean;
	toggleCart: (e?: React.MouseEvent) => void;
	cartButtonRef: React.RefObject<HTMLAnchorElement>;
	stableCartItems: any[];
}

interface ErrorState {
	itemId: string;
	message: string;
	type: "delete" | "quantity" | "stock";
}

const Cart: React.FC<CartProps> = ({ cartOpen, toggleCart, cartButtonRef }) => {
	const {
		handleCartItemOnDelete,
		handleIncreaseQuantity,
		handleDecreaseQuantity,
		updatingItems,
		cartItems,
	} = useCart();

	const { setCartOpen } = useUI();
	const sideCartRef = useRef<HTMLDivElement>(null);

	// Enhanced error state management
	const [errors, setErrors] = useState<ErrorState[]>([]);
	const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());

	// Clear errors after 5 seconds
	useEffect(() => {
		if (errors.length > 0) {
			const timer = setTimeout(() => {
				setErrors([]);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [errors]);

	// Add error helper
	const addError = useCallback(
		(itemId: string, message: string, type: ErrorState["type"]) => {
			setErrors((prev) => {
				const filtered = prev.filter((error) => error.itemId !== itemId);
				return [...filtered, { itemId, message, type }];
			});
		},
		[]
	);

	// Clear error for specific item
	const clearError = useCallback((itemId: string) => {
		setErrors((prev) => prev.filter((error) => error.itemId !== itemId));
	}, []);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent): void => {
			if (
				cartOpen &&
				sideCartRef.current &&
				!sideCartRef.current.contains(e.target as Node) &&
				cartButtonRef.current &&
				!cartButtonRef.current.contains(e.target as Node)
			) {
				toggleCart();
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [cartOpen, toggleCart, cartButtonRef]);

	const getCartVariantLabel = useCallback((item: any): string | null => {
		try {
			const name = item?.variant?.name || item?.selectedVariant?.name;
			if (name && typeof name === "string") return name;

			const candidates = [
				item?.variant?.attributes,
				item?.variant?.attributeValues,
				item?.variant?.attrs,
				item?.variant?.attributeSpecs,
				item?.variantAttributes,
				item?.attributes,
			];

			for (const c of candidates) {
				if (!c) continue;
				const formatted = formatAttributes(c);
				if (formatted) return formatted;
			}

			const sku = item?.variant?.sku || item?.sku || item?.variantSku;
			if (sku) return `SKU: ${sku}`;
		} catch (error) {
			console.error("Error getting variant label:", error);
		}
		return null;
	}, []);

	const formatAttributes = useCallback((attrs: any): string => {
		if (!attrs) return "";
		if (Array.isArray(attrs)) {
			return attrs
				.map((a) => {
					if (!a) return "";
					if (typeof a === "string") return a;
					if (typeof a === "object") {
						const key = a.key || a.name || a.attribute || Object.keys(a)[0];
						const value = a.value || a.val || a.option || a[key];
						return [key, value].filter(Boolean).join(": ");
					}
					return String(a);
				})
				.filter(Boolean)
				.join(", ");
		}
		if (typeof attrs === "object") {
			return Object.entries(attrs)
				.map(([k, v]) => `${k}: ${v}`)
				.join(", ");
		}
		return String(attrs);
	}, []);

	// Fixed delete function with event stopping
	const handleDeleteItem = useCallback(
		async (item: any, e?: React.MouseEvent) => {
			// Stop event propagation to prevent cart from closing
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

			const itemId = item.lineItemId || item.id || item.itemId;
			if (!itemId) {
				console.error("No valid item ID found for deletion:", item);
				addError(
					itemId || "unknown",
					"Unable to remove item - invalid ID",
					"delete"
				);
				return;
			}

			clearError(itemId);
			setIsProcessing((prev) => new Set(prev).add(itemId));

			try {
				// Pass the entire item object, not just the ID
				await handleCartItemOnDelete(item);
			} catch (error) {
				console.error("Delete failed, trying quantity 0 fallback:", error);

				try {
					// Fallback: Set quantity to 0
					await handleDecreaseQuantity(itemId, item.quantity);
					console.log("Successfully removed item via quantity 0");
				} catch (quantityError) {
					console.error("Quantity fallback also failed:", quantityError);
					addError(
						itemId,
						"Unable to remove item. Please try again.",
						"delete"
					);
				}
			} finally {
				// Quick cleanup without triggering re-renders
				setTimeout(() => {
					setIsProcessing((prev) => {
						const newSet = new Set(prev);
						newSet.delete(itemId);
						return newSet;
					});
				}, 100);
			}
		},
		[handleCartItemOnDelete, handleDecreaseQuantity, addError, clearError]
	);

	// Get error for specific item
	const getItemError = useCallback(
		(itemId: string) => {
			return errors.find((error) => error.itemId === itemId);
		},
		[errors]
	);

	// Use cartItems directly for real-time updates
	const orderedCartItems = React.useMemo(() => {
		return [...cartItems]; // Use cartItems directly for real-time updates
	}, [cartItems]);

	// Optimized subtotal calculation that updates immediately
	const subtotal = React.useMemo(() => {
		return cartItems.reduce(
			(total, item) => total + item.price * item.quantity,
			0
		);
	}, [cartItems]);

	// Highly optimized cart item component with minimal re-renders
	const CartItem = React.memo(
		({ item }: { item: any }) => {
			const itemId = item.lineItemId || item.id || item.itemId;
			const isUpdating =
				updatingItems?.has?.(itemId) || isProcessing.has(itemId);
			const itemError = getItemError(itemId);
			const variantLabel = getCartVariantLabel(item);

			// Local state for immediate UI feedback without waiting for context updates
			const [localQuantity, setLocalQuantity] = useState(item.quantity);
			const [isLocalUpdating, setIsLocalUpdating] = useState(false);

			// Update local quantity when item quantity changes from external sources
			useEffect(() => {
				setLocalQuantity(item.quantity);
			}, [item.quantity]);

			// Optimized quantity handlers with immediate local updates
			const handleLocalIncrease = useCallback(
				async (e: React.MouseEvent) => {
					e.preventDefault();
					e.stopPropagation();

					setIsLocalUpdating(true);
					setLocalQuantity((prev) => prev + 1); // Immediate local update

					try {
						await handleIncreaseQuantity(itemId, 1);
					} catch (error) {
						setLocalQuantity(item.quantity); // Revert on error
						console.error("Error increasing quantity:", error);

						// Check if it's a stock issue
						const errorMessage = (error as any)?.message?.toLowerCase() || "";
						if (
							errorMessage.includes("stock") ||
							errorMessage.includes("inventory") ||
							errorMessage.includes("available")
						) {
							addError(itemId, "Not enough stock available", "stock");
						} else {
							addError(
								itemId,
								"Unable to update quantity. Please try again.",
								"quantity"
							);
						}
					} finally {
						setIsLocalUpdating(false);
					}
				},
				[itemId, item.quantity, handleIncreaseQuantity, addError]
			);

			const handleLocalDecrease = useCallback(
				async (e: React.MouseEvent) => {
					e.preventDefault();
					e.stopPropagation();

					if (localQuantity <= 1) {
						await handleDeleteItem(item, e);
						return;
					}

					setIsLocalUpdating(true);
					setLocalQuantity((prev) => prev - 1); // Immediate local update

					try {
						await handleDecreaseQuantity(itemId, 1);
					} catch (error) {
						setLocalQuantity(item.quantity); // Revert on error
						console.error("Error decreasing quantity:", error);
						addError(
							itemId,
							"Unable to update quantity. Please try again.",
							"quantity"
						);
					} finally {
						setIsLocalUpdating(false);
					}
				},
				[
					itemId,
					item.quantity,
					localQuantity,
					handleDecreaseQuantity,
					handleDeleteItem,
					addError,
				]
			);

			return (
				<div
					className={`cart__item cart__item--uniform-size ${
						isUpdating || isLocalUpdating ? "cart__item--updating" : ""
					} ${itemError ? "cart__item--error" : ""}`}
				>
					{/* Error message */}
					{itemError && (
						<div
							className={`cart__item-error cart__item-error--${itemError.type}`}
						>
							<FaExclamationCircle className="cart__item-error-icon" />
							<span className="cart__item-error-text">{itemError.message}</span>
							<button
								className="cart__item-error-dismiss"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									clearError(itemId);
								}}
								aria-label="Dismiss error"
							>
								<FaTimes />
							</button>
						</div>
					)}

					<div className="cart__item-image-container">
						<img
							src={item.image || "../assets/iphone.jpg"}
							alt={item.name}
							className="cart__item-image"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.src = "../assets/iphone.jpg";
							}}
						/>
					</div>

					<div className="cart__item-content">
						<div className="cart__item-header">
							<h4 className="cart__item-name">{item.name}</h4>
							<button
								className="cart__item-remove"
								aria-label="Remove item"
								onClick={(e) => handleDeleteItem(item, e)}
								disabled={isUpdating || isLocalUpdating}
							>
								{isUpdating || isLocalUpdating ? (
									<div className="cart__item-remove-loading"></div>
								) : (
									<FaTrash />
								)}
							</button>
						</div>

						{variantLabel && (
							<div className="cart__item-variant">{variantLabel}</div>
						)}

						<div className="cart__item-footer">
							<div className="cart__item-price">
								Rs. {item.price.toLocaleString("en-IN")}
							</div>

							<div className="cart__item-controls">
								<div className="cart__quantity-controls">
									<button
										type="button"
										aria-label={
											localQuantity <= 1 ? "Remove item" : "Decrease quantity"
										}
										className="cart__qty-btn cart__qty-btn--decrease"
										onClick={handleLocalDecrease}
										disabled={isUpdating || isLocalUpdating}
									>
										{localQuantity <= 1 ? <FaTrash /> : <FaMinus />}
									</button>

									<span
										className={`cart__quantity-display ${
											isUpdating || isLocalUpdating
												? "cart__quantity-display--updating"
												: ""
										}`}
									>
										{localQuantity}
									</span>

									<button
										type="button"
										aria-label="Increase quantity"
										className="cart__qty-btn cart__qty-btn--increase"
										onClick={handleLocalIncrease}
										disabled={isUpdating || isLocalUpdating}
									>
										<FaPlus />
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Loading overlay - only show for major operations, not quantity changes */}
					{isUpdating && !isLocalUpdating && (
						<div className="cart__item-loading-overlay">
							<div className="cart__item-loading-spinner"></div>
						</div>
					)}
				</div>
			);
		},
		(prevProps, nextProps) => {
			// Custom comparison function to prevent unnecessary re-renders
			const prevItem = prevProps.item;
			const nextItem = nextProps.item;

			return (
				prevItem.quantity === nextItem.quantity &&
				prevItem.price === nextItem.price &&
				prevItem.name === nextItem.name &&
				prevItem.image === nextItem.image
			);
		}
	);

	// Prevent cart from closing when clicking inside cart content
	const handleCartContentClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
	}, []);

	return (
		<>
			<div
				className={`cart__overlay ${cartOpen ? "cart__overlay--visible" : ""}`}
				onClick={toggleCart}
			></div>

			<div
				className={`cart ${cartOpen ? "cart--open" : ""}`}
				ref={sideCartRef}
				onClick={handleCartContentClick} // Prevent clicks inside cart from bubbling
			>
				<div className="cart__header">
					<div className="cart__header-content">
						<h2 className="cart__title">
							<FaShoppingBag className="cart__title-icon" />
							Your Shopping Cart
							{cartItems.length > 0 && (
								<span className="cart__item-count">{cartItems.length}</span>
							)}
						</h2>
						<button
							className="cart__close"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								toggleCart();
							}}
							aria-label="Close cart"
						>
							<FaTimes />
						</button>
					</div>
				</div>

				<div className="cart__content">
					{cartItems.length === 0 ? (
						<div className="cart__empty">
							<div className="cart__empty-icon">
								<FaShoppingBag />
							</div>
							<h3 className="cart__empty-title">Your cart is empty</h3>
							<p className="cart__empty-text">
								Looks like you haven't added any items to your cart yet.
							</p>
							<Link
								to="/shop"
								className="cart__empty-button"
								onClick={(e) => {
									e.stopPropagation();
									setCartOpen(false);
								}}
							>
								Start Shopping
							</Link>
						</div>
					) : (
						<>
							<div className="cart__items">
								{orderedCartItems.map((item) => {
									const itemId = item.lineItemId || item.id || item.itemId;
									return (
										<CartItem
											key={itemId}
											item={item}
										/>
									);
								})}
							</div>

							<div className="cart__summary">
								<div className="cart__subtotal">
									<span className="cart__subtotal-label">Subtotal:</span>
									<span className="cart__subtotal-amount">
										Rs. {subtotal.toLocaleString("en-IN")}
									</span>
								</div>

								<div className="cart__shipping-note">
									Shipping & taxes calculated at checkout
								</div>

								<div className="cart__buttons">
									<Link
										to="/checkout"
										className="cart__button cart__button--checkout"
										onClick={(e) => {
											e.stopPropagation();
											setCartOpen(false);
										}}
									>
										Proceed to Checkout
									</Link>

									<Link
										to="/shop"
										className="cart__button cart__button--continue"
										onClick={(e) => {
											e.stopPropagation();
											setCartOpen(false);
										}}
									>
										Continue Shopping
									</Link>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default Cart;