import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider, AdminGuard } from '../lib/adminAuth';
import AdminLayout, { AdminDashboard } from '../pages/admin/AdminLayout';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminProducts, { AdminProductList, AdminProductForm } from '../pages/admin/AdminProducts';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminPanelUsers from '../pages/admin/AdminPanelUsers';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminHomeBanner from '../pages/admin/AdminHomeBanner';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminAbout from '../pages/admin/AdminAbout';
import AdminContact from '../pages/admin/AdminContact';
import AdminSmtp from '../pages/admin/AdminSmtp';
import Notification, { setNotificationCallback } from '../components/Notification';
import { useCallback, useState } from 'react';

export default function AdminApp() {
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
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/"
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
            <Route path="admin-users" element={<AdminPanelUsers />} />
            <Route path="smtp" element={<AdminSmtp />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        <Notification
          message={notification}
          show={showNotificationState}
          onClose={handleCloseNotification}
        />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
