import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2Icon } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
  requiresApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAdmin = false,
  requiresApproval = true
}) => {
  const {
    isAuthenticated,
    isAdmin,
    isApproved,
    isPending,
    loading
  } = useAuth();

  // Show loading indicator while authentication state is being determined
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#f5f0e8] flex items-center justify-center">
        <div className="flex items-center">
          <Loader2Icon className="h-6 w-6 text-[#d4a5a5] animate-spin mr-3" />
          <p className="text-[#3a3226] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Check if user is pending approval and redirect to pending page
  // Skip this check if the route doesn't require approval (like the pending approval page itself)
  if (requiresApproval && isPending()) {
    return <Navigate to="/pending-approval" />;
  }

  if (requiresAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;