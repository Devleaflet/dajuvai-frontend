export function getProductRemovalConfirmation(isArchive: boolean) {
  return isArchive
    ? {
        title: "Archive Product",
        action: "Archive",
        loadingAction: "Archiving...",
      }
    : {
        title: "Delete Product",
        action: "Delete",
        loadingAction: "Deleting...",
      };
}
