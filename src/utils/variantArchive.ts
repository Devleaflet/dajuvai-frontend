export function requiresVariantArchiveConfirmation(variant: {
  id?: unknown;
}): boolean {
  return typeof variant.id === "number" && Number.isInteger(variant.id) && variant.id > 0;
}
