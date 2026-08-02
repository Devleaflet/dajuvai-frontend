type CartSelectionItem = {
  productId?: number;
  product?: { id?: number };
  variantId?: number | null;
  variant?: { id?: number };
  selectedVariant?: { id?: number };
  quantity?: number;
};

const toValidId = (value: unknown): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const getCartQuantityForSelection = (
  items: CartSelectionItem[],
  productId: number | undefined,
  variantId?: number | null,
): number => {
  const targetProductId = toValidId(productId);
  const targetVariantId = toValidId(variantId);
  if (!targetProductId) return 0;

  return items.reduce((total, item) => {
    const itemProductId = toValidId(item.productId ?? item.product?.id);
    const itemVariantId = toValidId(
      item.variantId ?? item.variant?.id ?? item.selectedVariant?.id,
    );
    const isSameSelection =
      itemProductId === targetProductId && itemVariantId === targetVariantId;
    return isSameSelection ? total + Math.max(0, Number(item.quantity) || 0) : total;
  }, 0);
};

export const getSelectableQuantityLimit = (
  stock: unknown,
  alreadyInCart: unknown,
): number =>
  Math.max(0, (Number(stock) || 0) - Math.max(0, Number(alreadyInCart) || 0));

export const getUnitDiscountAmount = (
  lineDiscountAmount: unknown,
  quantity: unknown,
): number => {
  const lineDiscount = Math.max(0, Number(lineDiscountAmount) || 0);
  const count = Number(quantity);
  return count > 0 ? lineDiscount / count : lineDiscount;
};

// Cart +/- updates optimistically. priceBreakdown is still server data for
// previous quantity, so recover that snapshot quantity before deriving unit
// discount. Never divide a stale line total by optimistic quantity.
export const getSnapshotUnitDiscountAmount = (
  lineDiscountAmount: unknown,
  lineTotal: unknown,
  unitPrice: unknown,
  fallbackQuantity: unknown,
): number => {
  const total = Number(lineTotal);
  const unit = Number(unitPrice);
  const snapshotQuantity = total > 0 && unit > 0 ? total / unit : Number.NaN;
  const quantity =
    Number.isFinite(snapshotQuantity) && snapshotQuantity > 0
      ? snapshotQuantity
      : fallbackQuantity;
  return getUnitDiscountAmount(lineDiscountAmount, quantity);
};
