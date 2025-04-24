import React, { useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import { AdminPanel } from './pages/AdminPanel';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { Toaster } from "@/components/ui/toaster";
import BillHistory from './pages/BillHistory';
import { useAuth } from './contexts/AuthContext';

// ScrollToTop component that scrolls to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Protected route component
const ProtectedRoute = ({ element, requiredRole }: { element: JSX.Element, requiredRole?: string }) => {
  const { isLoggedIn, userRole } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return element;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/inventory" element={<ProtectedRoute element={<Inventory />} requiredRole="admin" />} />
      <Route path="/billing" element={<ProtectedRoute element={<Billing />} />} />
      <Route path="/billhistory" element={<ProtectedRoute element={<BillHistory />} requiredRole="admin" />} />
      <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
      <Route path="/*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <AppRoutes />
        </main>
        <Footer />
      </div>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
