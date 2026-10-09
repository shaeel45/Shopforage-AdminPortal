import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Context
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { ToastProvider } from "./context/ToastContext";

// Layout components
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

// Pages
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import PromoCodes from "./pages/PromoCodes";
import Settings from "./pages/Settings";

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Main admin layout with sidebar + top bar
function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggle = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased text-stone-900 selection:bg-stone-900 selection:text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggle} />

      {/* Main content area — shifts right when sidebar is expanded on desktop */}
      <div
        className={`transition-all duration-300 ease-in-out min-h-screen flex flex-col
          ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}
      >
        <TopBar onMenuToggle={toggle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/products"    element={<Products />} />
            <Route path="/orders"      element={<Orders />} />
            <Route path="/customers"   element={<Customers />} />
            <Route path="/inventory"   element={<Inventory />} />
            <Route path="/promo-codes" element={<PromoCodes />} />
            <Route path="/settings"    element={<Settings />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Root app — handles login redirect logic
function AppRoutes() {
  const { isAuthenticated } = useAdminAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <AdminLogin />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </ToastProvider>
  );
}
