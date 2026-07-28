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
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import Portal from "./Portal";
import { getDiscountDisplay } from "../utils/priceDisplay";
import defaultProductImage from "../assets/logo.webp";
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

interface CartPriceBreakdownView {
  baseUnitPrice: number;
  productDiscountAmount: number;
  dealDiscountAmount: number;
  dealLabel: string | null;
  dealPercent: number | null;
  productDiscountType: string | null;
  savingsTotal: number;
}

const formatCartMoney = (value: number | string | null | undefined): string =>
  Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAttributes = (attrs: any): string => {
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
};

const getCartVariantLabel = (item: any): string | null => {
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
};

const getCartItemId = (item: any): number | null => {
  const rawId = item?.lineItemId ?? item?.id ?? item?.itemId;
  const parsedId = Number(rawId);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

const getCartItemStockLimit = (item: any): number | null => {
  const rawStock =
    item?.variant?.stock ??
    item?.selectedVariant?.stock ??
    item?.variantStock ??
    item?.product?.stock ??
    item?.stock;
  const parsedStock = Number(rawStock);
  return Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : null;
};

const getCartPriceBreakdownView = (item: any): CartPriceBreakdownView | null => {
  const quantity = Number(item?.quantity ?? 0) || 1;
  const snapshot = item?.priceBreakdown;
  const snapshotSavings = Number(snapshot?.savingsTotal ?? 0);

  if (snapshot && snapshotSavings > 0) {
    const productDiscountAmount = Number(snapshot.productDiscount?.amount ?? 0);
    const dealDiscountAmount = Number(snapshot.dealDiscount?.amount ?? 0);
    return {
      baseUnitPrice: Number(
        snapshot.basePrice ??
          (Number(snapshot.lineBaseTotal ?? 0) > 0
            ? Number(snapshot.lineBaseTotal) / quantity
            : item.price),
      ),
      productDiscountAmount,
      dealDiscountAmount,
      dealLabel: snapshot.dealDiscount?.label ?? null,
      dealPercent:
        snapshot.dealDiscount?.percent != null
          ? Number(snapshot.dealDiscount.percent)
          : null,
      productDiscountType: snapshot.productDiscount?.type ?? null,
      savingsTotal: productDiscountAmount + dealDiscountAmount,
    };
  }

  const product = item?.product ?? {};
  const source = item?.variant ?? product;
  const basePrice = Number(source?.basePrice ?? product?.basePrice ?? item?.price);
  const deal = product?.deal;
  const hasDeal =
    deal &&
    String(deal.status ?? "ENABLED").toUpperCase() !== "DISABLED" &&
    Number(deal.discountPercentage ?? 0) > 0;

  const discountDisplay = getDiscountDisplay({
    basePrice,
    finalPrice: item?.price,
    discount: source?.discount ?? null,
    discountAmount: source?.discountAmount,
    discountPercent: source?.discountPercent,
    discountType: source?.discountType,
  });

  if (!discountDisplay.hasDiscount && !hasDeal) return null;

  const fallbackSavings = Math.max(0, (basePrice - Number(item?.price ?? 0)) * quantity);
  const productDiscountAmount = hasDeal ? 0 : discountDisplay.savingsAmount * quantity;
  const dealDiscountAmount = hasDeal
    ? fallbackSavings || discountDisplay.savingsAmount * quantity
    : 0;
  const savingsTotal = productDiscountAmount + dealDiscountAmount;

  if (savingsTotal <= 0) return null;

  return {
    baseUnitPrice: basePrice,
    productDiscountAmount,
    dealDiscountAmount,
    dealLabel: deal?.name ?? null,
    dealPercent: hasDeal ? Number(deal.discountPercentage) || null : null,
    productDiscountType: source?.discountType ?? null,
    savingsTotal,
  };
};

interface CartItemRowProps {
  item: any;
  isUpdating: boolean;
  itemError?: ErrorState;
  onIncrease: (itemId: number) => Promise<void>;
  onDecrease: (itemId: number) => Promise<void>;
  onDelete: (item: any, e: React.MouseEvent) => void;
  onClearError: (itemId: string) => void;
  onError: (itemId: string, message: string, type: ErrorState["type"]) => void;
}

const CartItemRow = React.memo(
  ({
    item,
    isUpdating,
    itemError,
    onIncrease,
    onDecrease,
    onDelete,
    onClearError,
    onError,
  }: CartItemRowProps) => {
    const numericItemId = getCartItemId(item);
    const itemId = numericItemId ? String(numericItemId) : "invalid";
    const variantLabel = getCartVariantLabel(item);
    const stockLimit = getCartItemStockLimit(item);
    const priceBreakdown = getCartPriceBreakdownView(item);

    const [localQuantity, setLocalQuantity] = useState(item.quantity);
    const [isLocalUpdating, setIsLocalUpdating] = useState(false);
    const isAtStockLimit = stockLimit !== null && localQuantity >= stockLimit;

    useEffect(() => {
      setLocalQuantity(item.quantity);
    }, [item.quantity]);

    const handleLocalIncrease = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!numericItemId) {
          onError(
            itemId,
            "Unable to update quantity. Please refresh your cart.",
            "quantity",
          );
          return;
        }

        if (isAtStockLimit) {
          onError(
            itemId,
            stockLimit === 0
              ? "This item is out of stock"
              : `Only ${stockLimit} available in stock`,
            "stock",
          );
          return;
        }

        setIsLocalUpdating(true);
        setLocalQuantity((prev: number) => prev + 1);

        try {
          await onIncrease(numericItemId);
        } catch (error: any) {
          setLocalQuantity(item.quantity);
          const originalMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "";
          const message = originalMessage.toLowerCase();
          if (
            message.includes("stock") ||
            message.includes("inventory") ||
            message.includes("available")
          ) {
            onError(
              itemId,
              originalMessage || "Not enough stock available",
              "stock",
            );
          } else {
            onError(
              itemId,
              "Unable to update quantity. Please try again.",
              "quantity",
            );
          }
        } finally {
          setIsLocalUpdating(false);
        }
      },
      [
        itemId,
        numericItemId,
        item.quantity,
        isAtStockLimit,
        stockLimit,
        onIncrease,
        onError,
      ],
    );

    const handleLocalDecrease = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!numericItemId) {
          onError(
            itemId,
            "Unable to update quantity. Please refresh your cart.",
            "quantity",
          );
          return;
        }

        if (localQuantity <= 1) {
          onDelete(item, e);
          return;
        }

        setIsLocalUpdating(true);
        setLocalQuantity((prev: number) => prev - 1);

        try {
          await onDecrease(numericItemId);
        } catch {
          setLocalQuantity(item.quantity);
          onError(
            itemId,
            "Unable to update quantity. Please try again.",
            "quantity",
          );
        } finally {
          setIsLocalUpdating(false);
        }
      },
      [
        itemId,
        numericItemId,
        item,
        localQuantity,
        onDecrease,
        onDelete,
        onError,
      ],
    );

    return (
      <div
        className={`cart__item cart__item--uniform-size ${
          isUpdating || isLocalUpdating ? "cart__item--updating" : ""
        } ${itemError ? "cart__item--error" : ""}`}
      >
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
                onClearError(itemId);
              }}
              aria-label="Dismiss error"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {!itemError && item.warningMessage && (
          <div className="cart__item-error cart__item-error--stock">
            <FaExclamationCircle className="cart__item-error-icon" />
            <span className="cart__item-error-text">
              {item.warningMessage}
            </span>
          </div>
        )}

        <div className="cart__item-image-container">
          <img
            src={item.image || defaultProductImage}
            alt={item.name}
            className="cart__item-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultProductImage;
            }}
          />
        </div>

        <div className="cart__item-content">
          <div className="cart__item-header">
            <h4 className="cart__item-name">{item.name}</h4>
            <button
              className="cart__item-remove"
              aria-label="Remove item"
              onClick={(e) => onDelete(item, e)}
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

          {stockLimit !== null && (
            <div
              className={`cart__item-stock ${
                isAtStockLimit ? "cart__item-stock--limit" : ""
              }`}
            >
              Stock: {stockLimit} available
            </div>
          )}

          <div className="cart__item-footer">
            <div className="cart__item-price">
              <span className="cart__item-price-current">
                Rs. {item.price.toLocaleString("en-IN")}
              </span>
              {priceBreakdown && (
                <>
                  <span className="cart__item-price-original">
                    Rs. {formatCartMoney(priceBreakdown.baseUnitPrice)}
                  </span>
                  <div className="cart__item-price-breakdown">
                    {priceBreakdown.productDiscountAmount > 0 && (
                      <span className="cart__item-price-pill cart__item-price-pill--discount">
                        Discount: -Rs. {formatCartMoney(priceBreakdown.productDiscountAmount)}
                      </span>
                    )}
                    {priceBreakdown.dealDiscountAmount > 0 && (
                      <span className="cart__item-price-pill cart__item-price-pill--deal">
                        Deal{priceBreakdown.dealLabel ? `: ${priceBreakdown.dealLabel}` : priceBreakdown.dealPercent ? `: ${priceBreakdown.dealPercent}%` : ""}: -Rs. {formatCartMoney(priceBreakdown.dealDiscountAmount)}
                      </span>
                    )}
                  </div>
                </>
              )}
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
                  aria-label={
                    isAtStockLimit
                      ? `Only ${stockLimit} available`
                      : "Increase quantity"
                  }
                  title={
                    isAtStockLimit
                      ? `Only ${stockLimit} available`
                      : "Increase quantity"
                  }
                  className="cart__qty-btn cart__qty-btn--increase"
                  onClick={handleLocalIncrease}
                  disabled={isUpdating || isLocalUpdating || isAtStockLimit}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
        </div>

        {isUpdating && !isLocalUpdating && (
          <div className="cart__item-loading-overlay">
            <div className="cart__item-loading-spinner"></div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.priceBreakdown === nextProps.item.priceBreakdown &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.image === nextProps.item.image &&
      prevProps.item.product?.deal?.id === nextProps.item.product?.deal?.id &&
      prevProps.item.product?.discount === nextProps.item.product?.discount &&
      prevProps.item.variant?.discount === nextProps.item.variant?.discount &&
      prevProps.isUpdating === nextProps.isUpdating &&
      prevProps.itemError === nextProps.itemError
    );
  },
);

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
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  const [errors, setErrors] = useState<ErrorState[]>([]);
  const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());

  // Auto-close on navigation to checkout
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevLocationRef.current;

    if (cartOpen && currentPath === "/checkout" && prevPath !== "/checkout") {
      setCartOpen(false);
    }

    prevLocationRef.current = currentPath;
  }, [location.pathname, cartOpen, setCartOpen]);

  // Auto-dismiss errors
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Body scroll lock — robust version that preserves scroll position
  useEffect(() => {
    if (cartOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.classList.add("cart-open");

      return () => {
        const storedScrollY = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.classList.remove("cart-open");
        window.scrollTo(0, parseInt(storedScrollY || "0") * -1);
      };
    }
  }, [cartOpen]);

  const addError = useCallback(
    (itemId: string, message: string, type: ErrorState["type"]) => {
      setErrors((prev) => {
        const filtered = prev.filter((error) => error.itemId !== itemId);
        return [...filtered, { itemId, message, type }];
      });
    },
    [],
  );

  const clearError = useCallback((itemId: string) => {
    setErrors((prev) => prev.filter((error) => error.itemId !== itemId));
  }, []);

  // Click outside to close
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

  // Escape key to close
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cartOpen) {
        toggleCart();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [cartOpen, toggleCart]);

  const handleDeleteItem = useCallback(
    async (item: any, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const numericItemId = getCartItemId(item);
      const itemId = numericItemId ? String(numericItemId) : "unknown";
      if (!numericItemId) {
        console.error("No valid item ID found for deletion:", item);
        addError(itemId, "Unable to remove item - invalid ID", "delete");
        return;
      }

      clearError(itemId);
      setIsProcessing((prev) => new Set(prev).add(itemId));

      try {
        await handleCartItemOnDelete(item);
      } catch (error) {
        console.error("Delete failed, trying quantity 0 fallback:", error);

        try {
          await handleDecreaseQuantity(numericItemId, item.quantity);
        } catch (quantityError) {
          console.error("Quantity fallback also failed:", quantityError);
          addError(
            itemId,
            "Unable to remove item. Please try again.",
            "delete",
          );
        }
      } finally {
        setTimeout(() => {
          setIsProcessing((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 100);
      }
    },
    [handleCartItemOnDelete, handleDecreaseQuantity, addError, clearError],
  );

  const getItemError = useCallback(
    (itemId: string) => {
      return errors.find((error) => error.itemId === itemId);
    },
    [errors],
  );

  const orderedCartItems = React.useMemo(() => {
    return [...cartItems];
  }, [cartItems]);

  const subtotal = React.useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }, [cartItems]);

  const hasBlockingWarnings = React.useMemo(
    () => cartItems.some((item) => Boolean(item.warningMessage)),
    [cartItems],
  );

  const handleIncreaseForItem = useCallback(
    (itemId: number) => handleIncreaseQuantity(itemId, 1),
    [handleIncreaseQuantity],
  );

  const handleDecreaseForItem = useCallback(
    (itemId: number) => handleDecreaseQuantity(itemId, 1),
    [handleDecreaseQuantity],
  );

  const handleCartContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleCloseCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCart();
    },
    [toggleCart],
  );

  return (
    <Portal containerId="cart-portal-root">
      <div
        className={`cart__overlay ${cartOpen ? "cart__overlay--visible" : ""}`}
        onClick={handleCloseCart}
      ></div>

      <div
        className={`cart ${cartOpen ? "cart--open" : ""}`}
        ref={sideCartRef}
        onClick={handleCartContentClick}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
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
              onClick={handleCloseCart}
              aria-label="Close cart"
              type="button"
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
                  toggleCart();
                }}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="cart__items">
                {orderedCartItems.map((item) => {
                  const numericItemId = getCartItemId(item);
                  const itemId = numericItemId
                    ? String(numericItemId)
                    : "invalid";
                  const isUpdating =
                    (numericItemId
                      ? updatingItems?.has?.(numericItemId)
                      : false) || isProcessing.has(itemId);
                  return (
                    <CartItemRow
                      key={itemId}
                      item={item}
                      isUpdating={isUpdating}
                      itemError={getItemError(itemId)}
                      onIncrease={handleIncreaseForItem}
                      onDecrease={handleDecreaseForItem}
                      onDelete={handleDeleteItem}
                      onClearError={clearError}
                      onError={addError}
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
                  {hasBlockingWarnings
                    ? "Resolve the item(s) above before checking out"
                    : "Shipping & taxes calculated at checkout"}
                </div>

                <div className="cart__buttons">
                  {hasBlockingWarnings ? (
                    <button
                      type="button"
                      className="cart__button cart__button--checkout"
                      disabled
                      aria-disabled="true"
                      title="Remove or adjust the flagged item(s) before checking out"
                    >
                      Proceed to Checkout
                    </button>
                  ) : (
                    <Link
                      to="/checkout"
                      className="cart__button cart__button--checkout"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCart();
                      }}
                    >
                      Proceed to Checkout
                    </Link>
                  )}

                  <Link
                    to="/shop"
                    className="cart__button cart__button--continue"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCart();
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
    </Portal>
  );
};

export default Cart;
