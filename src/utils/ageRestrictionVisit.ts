export function shouldPromptAgeGateOnMount(isRestricted: boolean): boolean {
  return Boolean(isRestricted);
}

type AgeRestrictedProduct = {
  ageRestriction?: {
    isRestricted?: boolean;
    minimumAge?: number | null;
  };
};

export function getVendorAgeGateState(products: AgeRestrictedProduct[]): {
  restricted: boolean;
  minimumAge: number;
} {
  const restrictedAges = products
    .filter((product) => product.ageRestriction?.isRestricted)
    .map((product) => product.ageRestriction?.minimumAge ?? 18);

  return {
    restricted: restrictedAges.length > 0,
    minimumAge: restrictedAges.length ? Math.max(...restrictedAges) : 18,
  };
}
