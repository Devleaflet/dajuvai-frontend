// This is a temporary file to fix the duplicate method issue
// The duplicate methods will be removed from the original file

// The issue is that there are duplicate approve/reject methods in the createVendorAPI function
// The first set is around line 100-150, and the second set is around line 300-350
// We need to keep only one set of these methods

// Here's how to fix it:
// 1. Keep the first set of methods (around line 100-150)
// 2. Remove the second set of methods (around line 300-350)
// 3. Make sure the handleConfirm function in the AdminVendor component is using the correct API methods

// The rest of the functionality appears to be working correctly with the changes we made:
// - Added Approve/Unapprove buttons that show based on vendor status
// - The buttons trigger the appropriate API calls
// - The UI updates to reflect the changes

// After making these changes, the duplicate method errors should be resolved.
