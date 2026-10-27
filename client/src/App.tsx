import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PosPage } from './pages/PosPage';
import { KitchenPage } from './pages/KitchenPage';
import { TablesPage } from './pages/TablesPage';
import { MenuPage } from './pages/MenuPage';
import { InventoryPage } from './pages/InventoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { StaffPage } from './pages/StaffPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage, OfflinePage } from './pages/NotFoundPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Protected App Routes inside AppShell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            {/* POS Kassa - cashier & admin */}
            <Route element={<ProtectedRoute allowedRoles={['cashier', 'admin']} />}>
              <Route path="/pos" element={<PosPage />} />
            </Route>

            {/* Kitchen KDS - chef & admin */}
            <Route element={<ProtectedRoute allowedRoles={['chef', 'admin']} />}>
              <Route path="/kitchen" element={<KitchenPage />} />
            </Route>

            {/* Tables Floor Plan - all authenticated roles */}
            <Route element={<ProtectedRoute allowedRoles={['cashier', 'chef', 'admin']} />}>
              <Route path="/tables" element={<TablesPage />} />
            </Route>

            {/* Receipt view - all authenticated roles */}
            <Route element={<ProtectedRoute allowedRoles={['cashier', 'chef', 'admin']} />}>
              <Route path="/orders/:id/receipt" element={<ReceiptPage />} />
            </Route>

            {/* Admin Only Pages: Menu, Inventory, Dashboard, Finance, Staff */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/finance" element={<DashboardPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/staff" element={<StaffPage />} />
            </Route>

            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
