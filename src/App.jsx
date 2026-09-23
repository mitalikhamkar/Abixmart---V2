// src/App.jsx — add the import and one route line inside the existing SiteLayout block
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import HowToTakeShilajit from '@/pages/HowToTakeShilajit';
import About from '@/pages/About';
import Support from '@/pages/Support';
import Login from '@/pages/Login';
import CreateAccount from '@/pages/CreateAccount';
import ForgotPassword from '@/pages/ForgotPassword';
import Account from '@/pages/Account';
import AuthAction from '@/pages/AuthAction';
import SiteLayout from '@/components/abix/SiteLayout';
import { ShopProvider } from '@/lib/ShopContext';
import { AuthProvider } from '@/lib/AuthContext';

import AdminLogin from '@/pages/AdminLogin';
import { AdminAuthProvider } from '@/admin/lib/AdminAuthContext';
import AdminGuard from '@/admin/components/AdminGuard';
import AdminLayout from '@/admin/layouts/AdminLayout';
import Overview from '@/admin/sections/Overview';
import Customers from '@/admin/sections/Customers';
import Orders from '@/admin/sections/Orders';
import Products from '@/admin/sections/Products';
import Inquiries from '@/admin/sections/Inquiries';
import Analytics from '@/admin/sections/Analytics';
import CustomerActivity from '@/admin/sections/CustomerActivity';
import Acquisition from '@/admin/sections/Acquisition';
import ProductPerformance from '@/admin/sections/ProductPerformance';
import Community from '@/admin/sections/Community';
import Settings from '@/admin/sections/Settings';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <ShopProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:slug" element={<ProductDetail />} />
                <Route path="/how-to-take-shilajit" element={<HowToTakeShilajit />} />
                <Route path="/about" element={<About />} />
                <Route path="/support" element={<Support />} />
                <Route path="/login" element={<Login />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/account" element={<Account />} />
                <Route path="/auth/action" element={<AuthAction />} />
              </Route>

              <Route element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminLayout />
                    </AdminGuard>
                  }
                >
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<Overview />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="products" element={<Products />} />
                  <Route path="inquiries" element={<Inquiries />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="customer-activity" element={<CustomerActivity />} />
                  <Route path="acquisition" element={<Acquisition />} />
                  <Route path="product-performance" element={<ProductPerformance />} />
                  <Route path="community" element={<Community />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </ShopProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App