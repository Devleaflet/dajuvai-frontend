export type CategoryRestrictionInput = {
  isAgeRestricted?: boolean;
  minimumAge?: number | null;
  restrictionMessage?: string | null;
};

export function toCategoryRestrictionPayload(
  category: CategoryRestrictionInput,
): Record<string, string> {
  if (!category.isAgeRestricted) return { isAgeRestricted: "false" };

  const payload: Record<string, string> = {
    isAgeRestricted: "true",
    minimumAge: String(category.minimumAge ?? 18),
  };
  const message = category.restrictionMessage?.trim();
  if (message) payload.restrictionMessage = message;
  return payload;
}
