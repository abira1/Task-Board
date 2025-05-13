import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAdmin = false
}) => {
  const {
    isAuthenticated,
    isAdmin
  } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  if (requiresAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};
export default ProtectedRoute;