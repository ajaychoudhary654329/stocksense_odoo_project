import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { authApi } from './api/auth';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ReceiptsPage from './pages/ReceiptsPage';
import DeliveriesPage from './pages/DeliveriesPage';
import InventoryPage from './pages/InventoryPage';
import MovesPage from './pages/MovesPage';
import ProductsPage from './pages/ProductsPage';
import WarehousesPage from './pages/WarehousesPage';
import LocationsPage from './pages/LocationsPage';
import SettingsPage from './pages/SettingsPage';
import OperationDetailPage from './pages/OperationDetailPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem('stocksense_token')));
  const { toasts, pushToast, dismissToast } = useToast();

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('stocksense_token');

    if (!token) {
      return () => { active = false; };
    }

    authApi.me()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        localStorage.setItem('stocksense_user', JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem('stocksense_token');
        localStorage.removeItem('stocksense_user');
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleToast = (event) => pushToast(event.detail?.message || '', event.detail?.type || 'success');
    window.addEventListener('stocksense-toast', handleToast);
    return () => window.removeEventListener('stocksense-toast', handleToast);
  }, [pushToast]);

  const isAuthenticated = Boolean(user);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('stocksense_user', JSON.stringify(nextUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
  };

  return (
    <BrowserRouter>
      {authLoading ? <div className="page-state auth-loading">Checking session...</div> : (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout user={user} onLogout={handleLogout} /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/receipts/:id" element={<OperationDetailPage type="receipt" />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/deliveries/:id" element={<OperationDetailPage type="delivery" />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/moves" element={<MovesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      )}
      <ToastContainer toasts={toasts} onClose={dismissToast} />
    </BrowserRouter>
  );
}

export default App;
