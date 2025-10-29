// Main App Component with React Router
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MeetingsPage from './pages/MeetingsPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import AdminPage from './pages/AdminPage';
import AnnouncementAdminPage from './pages/admin/AnnouncementAdminPage';
import MeetingAdminPage from './pages/admin/MeetingAdminPage';
import UserAdminPage from './pages/admin/UserAdminPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:roomId" element={<MeetingRoomPage />} />
            
            {/* Admin Only Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/announcements"
              element={
                <ProtectedRoute adminOnly>
                  <AnnouncementAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/meetings"
              element={
                <ProtectedRoute adminOnly>
                  <MeetingAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <UserAdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}export default App;
