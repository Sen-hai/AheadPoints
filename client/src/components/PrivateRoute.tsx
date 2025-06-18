import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 