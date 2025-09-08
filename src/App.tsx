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

// import VendorSignup from "./Pages/VendorSignup";
import PageNotFound from "./Pages/PageNotFound";
import { useAuth } from "./context/AuthContext";
import ScrollToTop from "./Components/ScrollToTop";
import type { ReactElement } from 'react';
import AdminDistrict from './Pages/AdminDistrict';
import DealAdmin from './Pages/DealAdmin';
import AdminPromo from './Pages/AdminPromo';
import AdminStaff from './Pages/AdminStaff';
import Shop from "./Pages/Shop";
import VendorStore from "./Pages/VendorStore";
import Checkout from "./Pages/CheckOut";
import { useVendorAuth } from "./context/VendorAuthContext"; // Import useVendorAuth
import NepalPaymentGateway from "./Pages/Payment";
import TransactionSuccess from "./Pages/Transaction";
import OrdersList from "./Pages/AdminOrders";
import Privacy from "./Pages/Privacy"
import PaymentSuccess from "./Pages/EsewaPaymentSuccess";
import GoogleAuthCallback from "./Pages/GoogleAuthCallback";
import GoogleAuthDirect from "./Pages/GoogleAuthDirect";
import GoogleAuthJson from "./Pages/GoogleAuthJson";
import GoogleAuthBackend from "./Pages/GoogleAuthBackend";
import FacebookAuthCallback from "./Pages/FacebookAuthCallback";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import DataDeletion from "./Pages/DataDeletion";
import TermsAndConditions from "./Pages/TermsAndConditions";
import AboutUs from "./Pages/AboutUs";
import EcommerceFAQ from "./Pages/Faq";
import BecomeVendor from "./Pages/BecomeVendor";
import UnapprovedVendors from "./Components/UnapprovedVendors";
import CommissionList from "./Pages/ComissionList";
// import VendorLogin from "./Pages/VendorLogin"
import SectionProducts from "./Components/SectionProducts";
import WebsiteComingSoon from "./Pages/WebsiteComingSoon";
import VendorTerms from "./Pages/VendorTerms";
import PasswordProtectedRoute from "./Components/SiteProtection/PasswordProtectedRoute";
import EsewaPaymentFailure from "./Pages/EsewaPaymentFailure";
// import VendorLoginPage from "./Pages/VendorLoginPage";
// import VendorSignupPage from "./Pages/VendorSignupPage";

// Admin route guards
// Allows both admin and staff to access admin area
const AdminOrStaffRoute = ({ children }: { children: ReactElement }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (user.role !== 'admin' && user.role !== 'staff') return <Navigate to="/" replace />;
  return children;
};

// Admin-only guard (e.g., Staff management page)
const AdminOnlyRoute = ({ children }: { children: ReactElement }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
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


// const SHOW_COMING_SOON = true;
// const isAuthenticated = localStorage.getItem("authenticated") === "true";  // comment this line of code and ----
const isAuthenticated = true;                                           // --- uncomment this line of code in local 


function App() {
  return (
    <>
      <Toaster />
      <ScrollToTop />
      <Routes>
        {/* Root "/" → Coming Soon until unlocked */}
        <Route
          path="/"
          element={
            !isAuthenticated ? <WebsiteComingSoon /> : <Home />
          }
        />

        {/* All other public routes require password */}
        <Route
          path="/contact"
          element={
            <PasswordProtectedRoute>
              <About />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <PasswordProtectedRoute>
              <EcommerceFAQ />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/terms"
          element={
            <PasswordProtectedRoute>
              <TermsAndConditions />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/vendor/terms"
          element={
            <PasswordProtectedRoute>
              <VendorTerms />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/commission-list"
          element={
            <PasswordProtectedRoute>
              <CommissionList />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <PasswordProtectedRoute>
              <Privacy />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/becomevendor"
          element={
            <PasswordProtectedRoute>
              <BecomeVendor />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <PasswordProtectedRoute>
              <AboutUs />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PasswordProtectedRoute>
              <Wishlist />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PasswordProtectedRoute>
              <Checkout />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/product-page/:id"
          element={
            <PasswordProtectedRoute>
              <ProductPage />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/product-page/:categoryId/:subcategoryId/:id"
          element={
            <PasswordProtectedRoute>
              <ProductPage />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/section/:sectionId"
          element={
            <PasswordProtectedRoute>
              <SectionProducts />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/user-profile"
          element={
            <PasswordProtectedRoute>
              <UserProfile />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/shop"
          element={
            <PasswordProtectedRoute>
              <Shop />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/vendor/:vendorId"
          element={
            <PasswordProtectedRoute>
              <VendorStore />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/order-page"
          element={
            <PasswordProtectedRoute>
              <NepalPaymentGateway />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/order/payment-response"
          element={
            <PasswordProtectedRoute>
              <TransactionSuccess />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/order/esewa-payment-success"
          element={
            <PasswordProtectedRoute>
              <PaymentSuccess />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/order/esewa-payment-failure"
          element={
            <PasswordProtectedRoute>
              <EsewaPaymentFailure />
            </PasswordProtectedRoute>
          }
        />

        {/* OAuth routes */}
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/auth/google/direct" element={<GoogleAuthDirect />} />
        <Route path="/auth/google/json" element={<GoogleAuthJson />} />
        <Route path="/auth/google/backend" element={<GoogleAuthBackend />} />
        <Route path="/auth/facebook/callback" element={<FacebookAuthCallback />} />
        <Route path="/google-auth-callback" element={<GoogleAuthCallback />} />

        {/* More public routes with password */}
        <Route
          path="/privacy-policy"
          element={
            <PasswordProtectedRoute>
              <PrivacyPolicy />
            </PasswordProtectedRoute>
          }
        />
        <Route
          path="/data-deletion"
          element={
            <PasswordProtectedRoute>
              <DataDeletion />
            </PasswordProtectedRoute>
          }
        />

        {/* Vendor Routes (already protected) */}
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

        {/* Admin Routes (already protected) */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminOrStaffRoute>
              <AdminDashboard />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-products"
          element={
            <AdminOrStaffRoute>
              <AdminProduct />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-orders"
          element={
            <AdminOrStaffRoute>
              <OrdersList />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-customers"
          element={
            <AdminOrStaffRoute>
              <AdminCustomers />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-categories"
          element={
            <AdminOrStaffRoute>
              <AdminCategories />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-vendors"
          element={
            <AdminOrStaffRoute>
              <AdminVendors />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-vendors/unapproved"
          element={
            <AdminOrStaffRoute>
              <UnapprovedVendors />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-banner"
          element={
            <AdminOrStaffRoute>
              <AdminBannerWithTabs />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-catalog"
          element={
            <AdminOrStaffRoute>
              <AdminCatalog />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin/district"
          element={
            <AdminOrStaffRoute>
              <AdminDistrict />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-deals"
          element={
            <AdminOrStaffRoute>
              <DealAdmin />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin-promo"
          element={
            <AdminOrStaffRoute>
              <AdminPromo />
            </AdminOrStaffRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <AdminOnlyRoute>
              <AdminStaff />
            </AdminOnlyRoute>
          }
        />
        {/* Fallback Route */}
        <Route path="*" element={<PageNotFound />} />
      </Routes >
    </>
  );
}

export default App;