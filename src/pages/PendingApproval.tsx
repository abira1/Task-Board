import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ApprovalAnimation from '../components/ApprovalAnimation';

const PendingApproval: React.FC = () => {
  const { user, logout, isApproved, isRejected, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is approved or not authenticated
  useEffect(() => {
    if (!loading) {
      if (isApproved()) {
        navigate('/dashboard');
      } else if (isRejected()) {
        // If rejected, we'll show the rejection message on this page
      } else if (!user) {
        navigate('/');
      }
    }
  }, [user, isApproved, isRejected, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#f5f0e8] flex items-center justify-center">
        <div className="flex items-center">
          <Loader2Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#d4a5a5] animate-spin mr-2 sm:mr-3" />
          <p className="text-[#3a3226] text-base sm:text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f5f0e8] flex flex-col overflow-hidden">
      {/* Header with logo - Minimal padding */}
      <div className="p-1.5 sm:p-2 md:p-3 flex-shrink-0">
        <img
          src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
          alt="Toiral Task Board"
          className="h-5 sm:h-6 md:h-7"
        />
      </div>

      {/* Main content - Perfectly centered with no scrolling */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 md:pb-4 overflow-hidden">
        {isRejected() ? (
          // Rejection message - More compact design
          <div className="w-full max-w-3xl text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                <AlertCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-red-500" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-[#3a3226] mb-2">Account Access Denied</h2>
            <p className="text-sm text-[#7a7067] mb-4 sm:mb-6 max-w-xl mx-auto">
              We're sorry, but your account request has been rejected. Please contact the administrator for more information.
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center bg-[#d4a5a5] text-white font-medium py-1.5 sm:py-2 md:py-2.5 px-4 sm:px-5 md:px-6 rounded-lg hover:bg-[#c99595] transition-colors mx-auto text-sm sm:text-base min-w-[100px] sm:min-w-[120px] md:min-w-[140px] shadow-sm hover:shadow-md"
            >
              <LogOutIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
              Sign Out
            </button>
          </div>
        ) : (
          // Pending approval message - More compact design
          <div className="w-full max-w-4xl flex flex-col h-full justify-center">
            {/* Animation - Increased size by ~25% */}
            <div className="flex justify-center mb-1 sm:mb-2 md:mb-3 flex-shrink-0">
              <div className="w-40 h-40 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64">
                <ApprovalAnimation />
              </div>
            </div>

            {/* Main heading - Optimized for larger animation */}
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-[#3a3226] text-center mb-1">
              Almost done — your dashboard's warming up
            </h1>

            {/* Description - Ultra-condensed for larger button */}
            <div className="text-center mb-1 sm:mb-1.5 md:mb-2">
              {/* Minimal text for mobile */}
              <div className="block sm:hidden">
                <p className="text-xs text-[#7a7067] max-w-2xl mx-auto">
                  We'll notify you once approved.
                </p>
              </div>

              {/* Condensed text for medium screens */}
              <div className="hidden sm:block md:hidden">
                <p className="text-xs text-[#7a7067] max-w-2xl mx-auto">
                  Your request is being reviewed. You'll gain access once approved.
                </p>
              </div>

              {/* Optimized text for larger screens */}
              <div className="hidden md:block">
                <p className="text-xs lg:text-sm text-[#7a7067] max-w-2xl mx-auto">
                  Your access request is being reviewed. We'll notify you once approved.
                </p>
              </div>
            </div>

            {/* Sign out button - Larger and more visible */}
            <div className="flex justify-center mt-1 sm:mt-2">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center bg-[#d4a5a5] text-white font-medium py-1.5 sm:py-2 md:py-2.5 px-4 sm:px-5 md:px-6 rounded-lg hover:bg-[#c99595] transition-colors text-sm sm:text-base min-w-[100px] sm:min-w-[120px] md:min-w-[140px] shadow-sm hover:shadow-md"
              >
                <LogOutIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApproval;
