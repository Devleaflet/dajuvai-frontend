export function canToggleHomepageCategory(
  selectedIds: string[],
  isCurrentIdSelected: boolean,
): boolean {
  return isCurrentIdSelected || selectedIds.length < 5;
}
