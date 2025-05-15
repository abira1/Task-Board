import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const {
    loginWithGoogle,
    isAuthenticated,
    loading
  } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      // Navigation will happen automatically via the useEffect
    } catch (err) {
      setError('Google login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <img src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png" alt="Toiral Task Board" className="h-16" />
        </div>

        <h1 className="font-['Caveat',_cursive] text-4xl text-center text-[#3a3226] mb-6">
          Welcome to Toiral
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-[#3a3226] text-lg font-medium mb-2">Sign in to your account</p>
            <p className="text-[#7a7067] text-sm">
              Use your Google account to access Toiral Task Board
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center bg-white border border-[#e0d6c8] text-[#3a3226] font-medium py-4 rounded-lg hover:bg-[#f5f0e8] transition-colors disabled:opacity-70"
          >
            {isLoggingIn ? (
              <>
                <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Admin access information removed for security and privacy */}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <Loader2Icon className="h-5 w-5 text-[#d4a5a5] animate-spin mr-3" />
              <p className="text-[#3a3226]">Loading your account...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoginPage;