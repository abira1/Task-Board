import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LeadProvider } from './contexts/LeadContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NetworkStatus from './components/NetworkStatus';
import InstallPrompt from './components/InstallPrompt';
import PreloadResources from './components/PreloadResources';
import { GooeyLoader } from './components/ui/loader-10';

// Use React.lazy for code splitting to improve initial load time
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const LeadManagement = lazy(() => import('./pages/LeadManagement'));
const ProgressTracker = lazy(() => import('./pages/ProgressTracker'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));

export function App() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Listen for PWA update events
    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true);
    };

    const handleOfflineReady = () => {
      setOfflineReady(true);
      // Hide the offline ready message after 3 seconds
      setTimeout(() => {
        setOfflineReady(false);
      }, 3000);
    };

    window.addEventListener('updateAvailable', handleUpdateAvailable);
    window.addEventListener('offlineReady', handleOfflineReady);

    return () => {
      window.removeEventListener('updateAvailable', handleUpdateAvailable);
      window.removeEventListener('offlineReady', handleOfflineReady);
    };
  }, []);

  // Loading component for Suspense fallback - Full screen for login/initial pages
  const FullScreenLoadingFallback = () => (
    <div className="flex justify-center items-center h-screen bg-[#f5f0e8]">
      <GooeyLoader size="medium" />
    </div>
  );

  // Loading component for page transitions - doesn't cover navbar
  const PageLoadingFallback = () => (
    <div className="flex justify-center items-center h-full min-h-[60vh] bg-[#f5f0e8]">
      <GooeyLoader size="medium" />
    </div>
  );

  return (
    <AuthProvider>
      <NotificationProvider>
        <LeadProvider>
          <Router>
            {/* Preload critical resources */}
            <PreloadResources />
            <Suspense fallback={<FullScreenLoadingFallback />}>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/download" element={<DownloadPage />} />
                <Route path="/pending-approval" element={
                  <ProtectedRoute requiresApproval={false}>
                    <PendingApproval />
                  </ProtectedRoute>
                } />
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  <Route path="/taskboard" element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <TaskBoard />
                    </Suspense>
                  } />
                  <Route path="/notifications" element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <NotificationsPage />
                    </Suspense>
                  } />
                  <Route path="/team" element={
                    <ProtectedRoute requiresAdmin>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <TeamManagement />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/progress" element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <ProgressTracker />
                    </Suspense>
                  } />
                  <Route path="/calendar" element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <CalendarView />
                    </Suspense>
                  } />
                  <Route path="/leads" element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <LeadManagement />
                    </Suspense>
                  } />
                </Route>
              </Routes>
            </Suspense>

            {/* PWA Components */}
            <NetworkStatus />
            <InstallPrompt />

            {/* Offline Ready Message */}
            {offlineReady && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#3a3226] text-white p-2 text-center text-sm z-50">
                App is ready for offline use
              </div>
            )}

            {/* Update Available Message */}
            {isUpdateAvailable && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#d4a5a5] text-white p-2 text-center text-sm z-50">
                New version available. Refresh to update.
              </div>
            )}
          </Router>
        </LeadProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
