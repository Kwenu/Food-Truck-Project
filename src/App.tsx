import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { StoreProvider } from './contexts/StoreContext';
import { CartProvider } from './contexts/CartContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { StaffAuthProvider } from './contexts/StaffAuthContext';
import { RequireStaff } from './components/shared/RequireStaff';
import { StaffLogin } from './pages/staff/StaffLogin';
import { Staff } from './pages/admin/Staff';
import { ThemeSync } from './components/shared/ThemeSync';
import { StoreGate } from './components/shared/StoreGate';
import { SetupRequired } from './components/shared/SetupRequired';
import { isSupabaseConfigured } from './lib/supabase';
import { Welcome } from './pages/customer/Welcome';
import { TakeawayStart } from './pages/customer/TakeawayStart';
import { DineInSetup } from './pages/customer/DineInSetup';
import { TableLanding } from './pages/customer/TableLanding';
import { Menu } from './pages/customer/Menu';
import { Cart } from './pages/customer/Cart';
import { Checkout } from './pages/customer/Checkout';
import { OrderStatus } from './pages/customer/OrderStatus';
import { TrackOrder } from './pages/customer/TrackOrder';
import { KitchenDisplay } from './pages/kitchen/KitchenDisplay';
import { AdminLayout } from './components/admin/AdminLayout';
import { Overview } from './pages/admin/Overview';
import { Orders } from './pages/admin/Orders';
import { MenuManagement } from './pages/admin/MenuManagement';
import { Tables } from './pages/admin/Tables';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

interface AppProps {
  brandPalette?: 'flame' | 'lime' | 'ocean' | 'berry';
}

export function App({ brandPalette = 'flame' }: AppProps) {
  if (!isSupabaseConfigured) return <SetupRequired />;

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <StaffAuthProvider>
          <StoreProvider>
            <StoreGate>
            <CurrencyProvider>
            <CartProvider>
            <ThemeSync palette={brandPalette} />
            <Toaster position="top-center" richColors closeButton />
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/takeaway" element={<TakeawayStart />} />
              <Route path="/dine-in" element={<DineInSetup />} />
              <Route path="/t/:tableCode" element={<TableLanding />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:number" element={<OrderStatus />} />
              <Route path="/track" element={<TrackOrder />} />

              {/* Staff-only area: hidden from customers, requires sign in */}
              <Route path="/staff" element={<Navigate to="/staff/login" replace />} />
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route
                path="/kitchen"
                element={
                <RequireStaff roles={['admin', 'manager', 'kitchen']}>
                  <KitchenDisplay />
                </RequireStaff>
                } />
              
              <Route
                path="/admin"
                element={
                <RequireStaff roles={['admin', 'manager']}>
                  <AdminLayout />
                </RequireStaff>
                }>
                <Route index element={<Overview />} />
                <Route path="orders" element={<Orders />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="tables" element={<Tables />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<RequireStaff roles={['admin']}><Settings /></RequireStaff>} />
                <Route path="staff" element={<RequireStaff roles={['admin']}><Staff /></RequireStaff>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
            </CurrencyProvider>
            </StoreGate>
          </StoreProvider>
        </StaffAuthProvider>
      </MotionConfig>
    </BrowserRouter>);

}