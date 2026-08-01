export type DiscountType =
  | "PERCENTAGE"
  | "FLAT"
  | "NONE"
  | string
  | null
  | undefined;

const toFiniteNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;

  const parsed =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeDiscountType = (
  type: DiscountType
): "PERCENTAGE" | "FLAT" | "NONE" => {
  if (type === "PERCENTAGE" || type === "FLAT") return type;
  return "NONE";
};

type PromotionSelection = {
  dealId?: number | null;
  discountAmount?: number | string | null;
  discountPercent?: number | string | null;
  discountType?: DiscountType;
};

export const resolvePromotionSelection = ({
  dealId = null,
  discountAmount = 0,
  discountPercent = 0,
  discountType = "NONE",
}: PromotionSelection) => {
  const normalizedDiscountType = normalizeDiscountType(discountType);
  const hasCustomDiscount =
    (normalizedDiscountType === "FLAT" && toFiniteNumber(discountAmount) > 0) ||
    (normalizedDiscountType === "PERCENTAGE" && toFiniteNumber(discountPercent) > 0);

  return {
    dealId: hasCustomDiscount ? null : dealId,
    discountAmount: toFiniteNumber(discountAmount),
    discountPercent: toFiniteNumber(discountPercent),
    discountType: normalizedDiscountType,
  };
};

export const calculatePricingPreview = ({
  basePrice,
  discount,
  discountAmount,
  discountPercent,
  discountType,
  dealDiscountPercentage,
}: {
  basePrice: number | string | null | undefined;
  discount?: number | string | null;
  discountAmount?: number | string | null;
  discountPercent?: number | string | null;
  discountType?: DiscountType;
  dealDiscountPercentage?: number | string | null;
}) => {
  const normalizedBasePrice = Math.max(0, toFiniteNumber(basePrice));
  const normalizedDiscountAmount = Math.max(0, toFiniteNumber(discountAmount));
  const normalizedDiscountPercent = Math.max(0, toFiniteNumber(discountPercent));
  const normalizedDiscount = Math.max(0, toFiniteNumber(discount));
  const normalizedDealDiscountPercentage = Math.max(
    0,
    toFiniteNumber(dealDiscountPercentage)
  );
  const normalizedDiscountType = normalizeDiscountType(discountType);

  let customDiscountAmount = 0;
  if (normalizedDiscountPercent > 0 && normalizedDiscountType === "PERCENTAGE") {
    customDiscountAmount = normalizedBasePrice * (normalizedDiscountPercent / 100);
  } else if (normalizedDiscount > 0 && normalizedDiscountType === "PERCENTAGE") {
    customDiscountAmount = normalizedBasePrice * (Math.min(100, normalizedDiscount) / 100);
  } else if (normalizedDiscountAmount > 0 && normalizedDiscountType === "FLAT") {
    customDiscountAmount = normalizedDiscountAmount;
  } else if (normalizedDiscount > 0 && normalizedDiscountType === "FLAT") {
    customDiscountAmount = normalizedDiscount;
  }

  const dealDiscountAmount = customDiscountAmount > 0
    ? 0
    : normalizedBasePrice * (normalizedDealDiscountPercentage / 100);

  const rawDiscountAmount = dealDiscountAmount + customDiscountAmount;
  const totalDiscountAmount = Number(Math.min(normalizedBasePrice, rawDiscountAmount).toFixed(2));
  const finalPrice = Number(Math.max(0, normalizedBasePrice - totalDiscountAmount).toFixed(2));

  return {
    basePrice: normalizedBasePrice,
    dealDiscountAmount,
    customDiscountAmount,
    totalDiscountAmount,
    finalPrice,
  };
};
