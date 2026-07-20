type DiscountType = 'PERCENTAGE' | 'FLAT' | 'NONE' | string | null | undefined;

interface DiscountDisplayInput {
  basePrice: number | string | null | undefined;
  finalPrice: number | string | null | undefined;
  discount?: number | string | null;
  discountType?: DiscountType;
}

export interface DiscountDisplay {
  hasDiscount: boolean;
  savingsAmount: number;
  badgeLabel: string | null;
  savingsLabel: string | null;
}

export const toMoneyNumber = (value: number | string | null | undefined): number => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatMoney = (value: number | string | null | undefined): string =>
  toMoneyNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(2)}`;
};

export const getDiscountDisplay = ({
  basePrice,
  finalPrice,
  discount,
  discountType,
}: DiscountDisplayInput): DiscountDisplay => {
  const base = toMoneyNumber(basePrice);
  const final = toMoneyNumber(finalPrice);
  const discountValue = toMoneyNumber(discount);
  const savingsAmount = Math.max(0, Math.round((base - final) * 100) / 100);
  const hasDiscount = base > 0 && final >= 0 && savingsAmount > 0;

  if (!hasDiscount) {
    return {
      hasDiscount: false,
      savingsAmount: 0,
      badgeLabel: null,
      savingsLabel: null,
    };
  }

  const normalizedType = String(discountType ?? 'NONE').toUpperCase();
  let badgeLabel: string | null;

  if (normalizedType === 'FLAT') {
    badgeLabel = `Rs ${formatMoney(savingsAmount)} off`;
  } else {
    // PERCENTAGE, or NONE/unknown with a real price gap — a product can end
    // up with finalPrice < basePrice without discount/discountType being
    // set at all (e.g. an admin Deal applied to the product: deals are a
    // separate mechanism from the product's own discount fields, and
    // intentionally leave discount/discountType at 0/NONE). Since a
    // percentage is always derivable directly from the price gap, default
    // to that instead of showing no badge whenever the type doesn't
    // positively say "FLAT".
    const actualPercent = (savingsAmount / base) * 100;
    const percentToShow =
      normalizedType === 'PERCENTAGE' &&
      discountValue > 0 &&
      Math.abs(actualPercent - discountValue) <= 0.05
        ? discountValue
        : actualPercent;
    badgeLabel = `-${formatPercent(percentToShow)}%`;
  }

  return {
    hasDiscount: true,
    savingsAmount,
    badgeLabel,
    savingsLabel: `Save Rs ${formatMoney(savingsAmount)}`,
  };
};
