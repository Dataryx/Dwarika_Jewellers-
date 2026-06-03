import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './lib/WishlistContext';
import { handleGoogleRedirect } from './lib/googleAuth';
import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Notification, { setNotificationCallback } from './components/Notification';
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import ExchangeGold from './pages/ExchangeGold';
import CustomDesign from './pages/CustomDesign';
import RepairMaintenance from './pages/RepairMaintenance';
import Certification from './pages/Certification';
import Login from './pages/Login';
import Account from './pages/Account';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';

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
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:category" element={<Collections />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/exchange-gold" element={<ExchangeGold />} />
              <Route path="/custom-design" element={<CustomDesign />} />
              <Route path="/repair-maintenance" element={<RepairMaintenance />} />
              <Route path="/certification" element={<Certification />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<Login />} />
              <Route path="/account" element={<Account />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Routes>
          </Layout>
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
