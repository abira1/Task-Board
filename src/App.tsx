import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import TeamManagement from './pages/TeamManagement';
import CalendarView from './pages/CalendarView';
import Layout from './components/Layout';
export function App() {
  return <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route element={<ProtectedRoute>
                  <Layout />
                </ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/taskboard" element={<TaskBoard />} />
              <Route path="/team" element={<ProtectedRoute requiresAdmin>
                    <TeamManagement />
                  </ProtectedRoute>} />
              <Route path="/calendar" element={<CalendarView />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>;
}