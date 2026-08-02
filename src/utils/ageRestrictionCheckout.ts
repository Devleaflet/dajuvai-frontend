type CheckoutItem = {
  ageRestriction?: { isRestricted?: boolean };
  product?: unknown;
};

export const hasAgeRestrictedCheckoutItems = (items: CheckoutItem[]): boolean =>
  items.some((item) => {
    const product = item.product as
      | { ageRestriction?: { isRestricted?: boolean } }
      | undefined;
    return Boolean(item.ageRestriction?.isRestricted || product?.ageRestriction?.isRestricted);
  });

export const isAgeRestrictedOrderAcknowledged = (
  items: CheckoutItem[],
  termsAgreed: boolean,
): boolean => hasAgeRestrictedCheckoutItems(items) && termsAgreed;
