import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LeadProvider } from './contexts/LeadContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import TeamManagement from './pages/TeamManagement';
import CalendarView from './pages/CalendarView';
import NotificationsPage from './pages/NotificationsPage';
import LeadManagement from './pages/LeadManagement';
import ProgressTracker from './pages/ProgressTracker';
import DownloadPage from './pages/DownloadPage';
import Layout from './components/Layout';
import NetworkStatus from './components/NetworkStatus';
import InstallPrompt from './components/InstallPrompt';
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

  return (
    <AuthProvider>
      <NotificationProvider>
        <LeadProvider>
          <Router>
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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/taskboard" element={<TaskBoard />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/team" element={
                  <ProtectedRoute requiresAdmin>
                    <TeamManagement />
                  </ProtectedRoute>
                } />
                <Route path="/progress" element={<ProgressTracker />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/leads" element={<LeadManagement />} />
              </Route>
            </Routes>

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