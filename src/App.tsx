import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LeadProvider } from './contexts/LeadContext';
import { ClientProvider } from './contexts/ClientContext';
import { QuotationProvider } from './contexts/QuotationContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ServiceProvider } from './contexts/ServiceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NetworkStatus from './components/NetworkStatus';
import InstallPrompt from './components/InstallPrompt';
import PreloadResources from './components/PreloadResources';

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
const ClientManagement = lazy(() => import('./pages/ClientManagement'));
const QuotationManagement = lazy(() => import('./pages/QuotationManagement'));
const QuotationEditor = lazy(() => import('./pages/QuotationEditor'));
const InvoiceManagement = lazy(() => import('./pages/InvoiceManagement'));
const InvoiceEditor = lazy(() => import('./pages/InvoiceEditor'));
const PaymentSettings = lazy(() => import('./pages/PaymentSettings'));
const ServiceManagement = lazy(() => import('./pages/ServiceManagement'));

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

  // Loading spinner component for Suspense fallback
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen bg-[#f5f0e8]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#d4a5a5]"></div>
    </div>
  );

  return (
    <AuthProvider>
      <NotificationProvider>
        <LeadProvider>
          <ClientProvider>
            <QuotationProvider>
              <InvoiceProvider>
                <PaymentProvider>
                  <ServiceProvider>
                  <Router>
                    {/* Preload critical resources */}
                    <PreloadResources />
                    <Suspense fallback={<LoadingSpinner />}>
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

                          {/* Client Management Routes */}
                          <Route path="/clients" element={<ClientManagement />} />
                          <Route path="/quotations" element={<QuotationManagement />} />
                          <Route path="/quotations/new" element={<QuotationEditor />} />
                          <Route path="/quotations/:id" element={<QuotationEditor />} />
                          <Route path="/invoices" element={<InvoiceManagement />} />
                          <Route path="/invoices/new" element={<InvoiceEditor />} />
                          <Route path="/invoices/:id" element={<InvoiceEditor />} />
                          <Route path="/payment-settings" element={
                            <ProtectedRoute requiresAdmin>
                              <PaymentSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="/services" element={
                            <ProtectedRoute requiresAdmin>
                              <ServiceManagement />
                            </ProtectedRoute>
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
                  </ServiceProvider>
                </PaymentProvider>
              </InvoiceProvider>
            </QuotationProvider>
          </ClientProvider>
        </LeadProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}