import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Home from "./Pages/Home";
import Vendor from "./Pages/Vendor";
import VendorProduct from "./Pages/VendorProduct";
import VendorOrder from "./Pages/VendorOrder";
import ProfilePage from "./Pages/ProfilePage";
import { AdminDashboard } from "./Pages/AdminDashboard";
import AdminProduct from "./Pages/AdminProduct";
import AdminCustomers from "./Pages/AdminCustomers";
import AdminCategories from "./Pages/AdminCategories";
import AdminVendors from "./Pages/AdminVendor";
import About from "./Pages/About";
import Wishlist from "./Pages/Wishlist";
import AdminBannerWithTabs from "./Pages/AdminBanner";
import AdminCatalog from "./Pages/AdminCatalog";
import ProductPage from "./Pages/ProductPage";
import UserProfile from "./Pages/UserProfile";
import VendorLogin from "./Pages/VendorLogin";
import VendorSignup from "./Pages/VendorSignup";
import PageNotFound from "./Pages/PageNotFound";
import { useAuth } from "./context/AuthContext";
import ScrollToTop from "./Components/ScrollToTop";
import type { ReactElement } from 'react';
import AdminDistrict from './Pages/AdminDistrict';
import DealAdmin from './Pages/DealAdmin';
import Shop from "./Pages/Shop";
import VendorStore from "./Pages/VendorStore";
import Checkout from "./Pages/CheckOut";
import { useVendorAuth } from "./context/VendorAuthContext"; // Import useVendorAuth
import NepalPaymentGateway from "./Pages/Payment";
import TransactionSuccess from "./Pages/Transaction";
import OrdersList from "./Pages/AdminOrders";

import PaymentSuccess from "./Pages/EsewaPaymentSuccess";
import GoogleAuthCallback from "./Pages/GoogleAuthCallback";
import GoogleAuthDirect from "./Pages/GoogleAuthDirect";
import GoogleAuthJson from "./Pages/GoogleAuthJson";
import GoogleAuthBackend from "./Pages/GoogleAuthBackend";
import FacebookAuthCallback from "./Pages/FacebookAuthCallback";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import DataDeletion from "./Pages/DataDeletion";

// ProtectedRoute component for admin routes
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />; // Redirect non-admin users to home
  }

  return children;
};

// ProtectedVendorRoute component for vendor routes (inlined)
const ProtectedVendorRoute = ({ children }: { children: ReactElement }) => {
  const { authState, isLoading } = useVendorAuth();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Only redirect if not authenticated and not loading
  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Toaster />
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<About />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product-page/:categoryId/:subcategoryId/:id" element={<ProductPage />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/vendor/:vendorId" element={<VendorStore />} />
        <Route path="/order-page" element={<NepalPaymentGateway/>}/>
        <Route path="/order/payment-response" element={<TransactionSuccess/>}/>
        <Route path="/order/esewa-payment-success" element={<PaymentSuccess/>}/>
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/auth/google/direct" element={<GoogleAuthDirect />} />
        <Route path="/auth/google/json" element={<GoogleAuthJson />} />
        <Route path="/auth/google/backend" element={<GoogleAuthBackend />} />
        <Route path="/auth/facebook/callback" element={<FacebookAuthCallback />} />
        <Route path="/google-auth-callback" element={<GoogleAuthCallback />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/data-deletion" element={<DataDeletion />} />

        {/* Vendor Routes (protected) */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/signup" element={<VendorSignup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedVendorRoute>
              <Vendor />
            </ProtectedVendorRoute>
          }
        />
        <Route
          path="/vendor-product"
          element={
            <ProtectedVendorRoute>
              <VendorProduct />
            </ProtectedVendorRoute>
          }
        />
        <Route
          path="/vendor-orders"
          element={
            <ProtectedVendorRoute>
              <VendorOrder />
            </ProtectedVendorRoute>
          }
        />
        <Route
          path="/vendor-profile"
          element={
            <ProtectedVendorRoute>
              <ProfilePage />
            </ProtectedVendorRoute>
          }
        />

        {/* Admin Routes (protected) */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-products"
          element={
            <ProtectedRoute>
              <AdminProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-orders"
          element={
            <ProtectedRoute>
              <OrdersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-customers"
          element={
            <ProtectedRoute>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-categories"
          element={
            <ProtectedRoute>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-vendors"
          element={
            <ProtectedRoute>
              <AdminVendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-banner"
          element={
            <ProtectedRoute>
              <AdminBannerWithTabs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-catalog"
          element={
            <ProtectedRoute>
              <AdminCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/district"
          element={
            <ProtectedRoute>
              <AdminDistrict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-deals"
          element={
            <ProtectedRoute>
              <DealAdmin />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;