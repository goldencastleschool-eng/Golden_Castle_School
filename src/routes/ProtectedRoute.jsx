import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role, redirectTo }) {
  const { user, isAuthenticated, loading } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];
  const secureStaffRoles = ["admin", "principal", "chairman"];
  const redirectPath =
    redirectTo ||
    (allowedRoles.some((allowedRole) => secureStaffRoles.includes(allowedRole))
      ? "/secure-admin-login"
      : "/login");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <span>Loading authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
