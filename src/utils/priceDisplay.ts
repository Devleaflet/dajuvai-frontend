type DiscountType = 'PERCENTAGE' | 'FLAT' | 'NONE' | string | null | undefined;

interface DiscountDisplayInput {
  basePrice: number | string | null | undefined;
  finalPrice: number | string | null | undefined;
  discount: number | string | null;
  discountAmount?: number | string | null;
  discountPercent?: number | string | null;
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
  discountAmount,
  discountPercent,
  discountType,
}: DiscountDisplayInput): DiscountDisplay => {

  const base = toMoneyNumber(basePrice);
  const final = toMoneyNumber(finalPrice);
  const normalizedType = String(discountType ?? "NONE").toUpperCase();

  // Normalize values. null/undefined become 0.
  const dAmount = toMoneyNumber(discountAmount ?? 0);
  const dPercent = toMoneyNumber(discountPercent ?? 0);

  const hasNewFields =
    discountAmount != null &&
    discountPercent != null &&
    dAmount > 0 &&
    dPercent > 0;

  let savingsAmount = 0;
  let percentToShow = 0;

  if (hasNewFields) {
    savingsAmount = dAmount;
    percentToShow = dPercent;
  } else if (normalizedType === "FIXED" || normalizedType === "PERCENTAGE") {

    if (discount != null) {
      const dValue = toMoneyNumber(discount);

      if (normalizedType === "FIXED") {
        savingsAmount = Math.max(0, dValue);
        percentToShow = base > 0 ? (savingsAmount / base) * 100 : 0;
      } else {
        percentToShow = Math.max(0, dValue);
        savingsAmount =
          base > 0
            ? Math.round(((percentToShow / 100) * base) * 100) / 100
            : 0;
      }
    } else {
      savingsAmount = Math.max(
        0,
        Math.round((base - final) * 100) / 100
      );

      percentToShow =
        base > 0 ? (savingsAmount / base) * 100 : 0;
    }
  }

  const hasDiscount = base > 0 && savingsAmount > 0;

  if (!hasDiscount) {
    return {
      hasDiscount: false,
      savingsAmount: 0,
      badgeLabel: null,
      savingsLabel: null,
    };
  }

  return {
    hasDiscount: true,
    savingsAmount,
    badgeLabel: `-${formatPercent(percentToShow)}%`,
    savingsLabel: `Save Rs ${formatMoney(savingsAmount)}`,
  };
};