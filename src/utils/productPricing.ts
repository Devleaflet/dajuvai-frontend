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
  discountAmount,
  discountPercent,
  discountType,
  dealDiscountPercentage,
}: {
  basePrice: number | string | null | undefined;
  discountAmount?: number | string | null;
  discountPercent?: number | string | null;
  discountType?: DiscountType;
  dealDiscountPercentage?: number | string | null;
}) => {
  const normalizedBasePrice = Math.max(0, toFiniteNumber(basePrice));
  const normalizedDiscountAmount = Math.max(0, toFiniteNumber(discountAmount));
  const normalizedDiscountPercent = Math.max(0, toFiniteNumber(discountPercent));
  const normalizedDealDiscountPercentage = Math.max(
    0,
    toFiniteNumber(dealDiscountPercentage)
  );
  const normalizedDiscountType = normalizeDiscountType(discountType);

  const dealDiscountAmount =
    normalizedBasePrice * (normalizedDealDiscountPercentage / 100);

  let customDiscountAmount = 0;
  if (normalizedDiscountPercent > 0 && normalizedDiscountType === "PERCENTAGE") {
    customDiscountAmount = normalizedBasePrice * (normalizedDiscountPercent / 100);
  } else if (normalizedDiscountAmount > 0 && normalizedDiscountType === "FLAT") {
    customDiscountAmount = normalizedDiscountAmount;
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
