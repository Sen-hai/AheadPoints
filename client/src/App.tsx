import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserCenter from './pages/UserCenter';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ActivityManagement from './pages/admin/ActivityManagement';
import ActivityParticipants from './pages/admin/ActivityParticipants';
import PointsRecords from './pages/admin/PointsRecords';
import ActivitiesList from './pages/ActivitiesList';
import ProductList from './pages/ProductList';
import ExchangeHistory from './pages/ExchangeHistory';
import ProductManagement from './pages/admin/ProductManagement';
import ExchangeManagement from './pages/admin/ExchangeManagement';
import { useAuth } from './hooks/useAuth';
import './App.css';

// 受保护的路由组件
const ProtectedRoute = ({ children, requiredRole = '' }: { children: React.ReactNode, requiredRole?: 'user' | 'admin' | '' }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (requiredRole === 'user' && user?.role === 'admin') {
    return <Navigate to="/admin-dashboard" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="activities" element={
            <ProtectedRoute requiredRole="user">
              <ActivitiesList />
            </ProtectedRoute>
          } />
          <Route path="products" element={
            <ProtectedRoute requiredRole="user">
              <ProductList />
            </ProtectedRoute>
          } />
          <Route path="exchange-history" element={
            <ProtectedRoute requiredRole="user">
              <ExchangeHistory />
            </ProtectedRoute>
          } />
          <Route path="user-center" element={
            <ProtectedRoute>
              <UserCenter />
            </ProtectedRoute>
          } />
          <Route path="user-dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin-dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/activities" element={
            <ProtectedRoute requiredRole="admin">
              <ActivityManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/activities/:activityId/participants" element={
            <ProtectedRoute requiredRole="admin">
              <ActivityParticipants />
            </ProtectedRoute>
          } />
          <Route path="admin/points-records" element={
            <ProtectedRoute requiredRole="admin">
              <PointsRecords />
            </ProtectedRoute>
          } />
          <Route path="admin/products" element={
            <ProtectedRoute requiredRole="admin">
              <ProductManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/exchanges" element={
            <ProtectedRoute requiredRole="admin">
              <ExchangeManagement />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
