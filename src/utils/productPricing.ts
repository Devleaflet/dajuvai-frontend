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

export const calculatePricingPreview = ({
  basePrice,
  discount,
  discountType,
  dealDiscountPercentage,
}: {
  basePrice: number | string | null | undefined;
  discount?: number | string | null;
  discountType?: DiscountType;
  dealDiscountPercentage?: number | string | null;
}) => {
  const normalizedBasePrice = Math.max(0, toFiniteNumber(basePrice));
  const normalizedDiscount = Math.max(0, toFiniteNumber(discount));
  const normalizedDealDiscountPercentage = Math.max(
    0,
    toFiniteNumber(dealDiscountPercentage)
  );
  const normalizedDiscountType = normalizeDiscountType(discountType);

  const dealDiscountAmount =
    normalizedBasePrice * (normalizedDealDiscountPercentage / 100);

  let customDiscountAmount = 0;
  if (normalizedDiscount > 0 && normalizedDiscountType === "PERCENTAGE") {
    customDiscountAmount = normalizedBasePrice * (normalizedDiscount / 100);
  } else if (normalizedDiscount > 0 && normalizedDiscountType === "FLAT") {
    customDiscountAmount = normalizedDiscount;
  }

  const rawDiscountAmount = dealDiscountAmount + customDiscountAmount;
  const totalDiscountAmount = Math.min(normalizedBasePrice, rawDiscountAmount);
  const finalPrice = Math.max(0, normalizedBasePrice - totalDiscountAmount);

  return {
    basePrice: normalizedBasePrice,
    dealDiscountAmount,
    customDiscountAmount,
    totalDiscountAmount,
    finalPrice,
  };
};
