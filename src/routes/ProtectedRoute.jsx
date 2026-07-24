import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from '../components/common/Loading.jsx';
import { getPortalLoginPath } from '../utils/portalHost.js';

export default function ProtectedRoute({ children, role, redirectTo }) {
  const { user, isAuthenticated, loading } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];
  const secureStaffRoles = ["admin", "principal", "chairman"];
  const redirectPath =
    redirectTo ||
    getPortalLoginPath(allowedRoles.some((allowedRole) => secureStaffRoles.includes(allowedRole))
      ? "/secure-admin-login"
      : "/login");

  if (loading) {
    return <PageLoader message="Checking your portal access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
