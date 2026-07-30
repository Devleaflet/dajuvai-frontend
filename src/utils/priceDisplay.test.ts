import assert from "node:assert/strict";
import { getDiscountDisplay } from "./priceDisplay.js";

const dealDiscount = getDiscountDisplay({
  basePrice: 1000,
  finalPrice: 850,
  discount: 0,
  discountAmount: 0,
  discountPercent: 0,
  discountType: "NONE",
});

assert.deepEqual(dealDiscount, {
  hasDiscount: true,
  savingsAmount: 150,
  badgeLabel: "-15%",
  savingsLabel: "Save Rs 150.00",
});
