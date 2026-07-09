/**
 * ProtectedRoute — redirects unauthenticated users to /login
 * and unauthorized roles to their own dashboard.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleDashboards = {
  admin:   '/admin',
  student: '/student',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-950">
        <div className="w-10 h-10 border-2 border-sapphire-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleDashboards[user.role] || '/login'} replace />;
  }

  return children;
}
