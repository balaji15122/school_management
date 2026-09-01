import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

// Pages
import Login from '../pages/Login';
import RegisterSchool from '../pages/RegisterSchool';
import Dashboard from '../pages/Dashboard';
import SchoolsManagement from '../pages/SchoolsManagement';
import StudentsManagement from '../pages/StudentsManagement';
import ExportCenter from '../pages/ExportCenter';
import UsersManagement from '../pages/UsersManagement';
import NotFound from '../pages/NotFound';

/**
 * Protected Route Wrapper
 * @param {boolean} superAdminOnly - restricts route strictly to super_admin role
 */
const ProtectedRoute = ({ children, superAdminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Loader fullPage text="Checking authentication status..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && user?.role !== 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

/**
 * Public Route Wrapper
 * Redirects logged in users to /admin/dashboard
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullPage text="Initializing EduCloud..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isLoading ? (
            <Loader fullPage />
          ) : isAuthenticated ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register-school"
        element={
          <PublicRoute>
            <RegisterSchool />
          </PublicRoute>
        }
      />

      {/* Protected Admin & Portal Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools"
        element={
          <ProtectedRoute superAdminOnly>
            <SchoolsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute>
            <StudentsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <ProtectedRoute>
            <ExportCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute superAdminOnly>
            <UsersManagement />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
