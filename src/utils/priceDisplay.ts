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

  // Top-left badge is always a percentage — even for a FLAT (Rs amount)
  // discount, converted from the actual price gap — so the two badges never
  // show the same kind of number twice (badge = %, savingsLabel = Rs amount).
  const actualPercent = (savingsAmount / base) * 100;
  const percentToShow =
    normalizedType === 'PERCENTAGE' &&
    discountValue > 0 &&
    Math.abs(actualPercent - discountValue) <= 0.05
      ? discountValue
      : actualPercent;
  const badgeLabel = `-${formatPercent(percentToShow)}%`;

  return {
    hasDiscount: true,
    savingsAmount,
    badgeLabel,
    savingsLabel: `Save Rs ${formatMoney(savingsAmount)}`,
  };
};
