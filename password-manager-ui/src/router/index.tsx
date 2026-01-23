import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

// Sayfalar (daha sonra oluşturulacak)
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AddPassword from '../pages/AddPassword';
import EditPassword from '../pages/EditPassword';
import ViewPassword from '../pages/ViewPassword';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

// Protected Route komponenti
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passwords/add"
          element={
            <ProtectedRoute>
              <AddPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passwords/:id"
          element={
            <ProtectedRoute>
              <ViewPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passwords/:id/edit"
          element={
            <ProtectedRoute>
              <EditPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};
