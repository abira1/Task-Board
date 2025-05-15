import React from 'react';
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
import Layout from './components/Layout';
export function App() {
  return <AuthProvider>
      <NotificationProvider>
        <LeadProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/pending-approval" element={<ProtectedRoute requiresApproval={false}>
                    <PendingApproval />
                  </ProtectedRoute>} />
              <Route element={<ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/taskboard" element={<TaskBoard />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/team" element={<ProtectedRoute requiresAdmin>
                      <TeamManagement />
                    </ProtectedRoute>} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/leads" element={<LeadManagement />} />
              </Route>
            </Routes>
          </Router>
        </LeadProvider>
      </NotificationProvider>
    </AuthProvider>;
}