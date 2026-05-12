import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './lib/WishlistContext';
import { handleGoogleRedirect } from './lib/googleAuth';
import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Notification, { setNotificationCallback } from './components/Notification';
import { AdminGuard } from './lib/adminAuth';
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Account from './pages/Account';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import AdminLayout, { AdminDashboard } from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProducts, { AdminProductList, AdminProductForm } from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminHomeBanner from './pages/admin/AdminHomeBanner';
import AdminCategories from './pages/admin/AdminCategories';
import AdminAbout from './pages/admin/AdminAbout';
import AdminContact from './pages/admin/AdminContact';

handleGoogleRedirect();

function App() {
  const [notification, setNotification] = useState('');
  const [showNotificationState, setShowNotificationState] = useState(false);

  const handleNotification = useCallback((message: string) => {
    setNotification(message);
    setShowNotificationState(true);
  }, []);

  setNotificationCallback(handleNotification);

  const handleCloseNotification = useCallback(() => {
    setShowNotificationState(false);
  }, []);

  return (
    <AuthProvider>
      <WishlistProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />}>
                <Route index element={<AdminProductList />} />
                <Route path="new" element={<AdminProductForm />} />
                <Route path="edit/:id" element={<AdminProductForm />} />
              </Route>
              <Route path="home-banner" element={<AdminHomeBanner />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="about" element={<AdminAbout />} />
              <Route path="contact" element={<AdminContact />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/collections/:category" element={<Collections />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password" element={<Login />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
          <Notification
            message={notification}
            show={showNotificationState}
            onClose={handleCloseNotification}
          />
        </BrowserRouter>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
