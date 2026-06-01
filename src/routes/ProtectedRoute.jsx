import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role }) {
  // 1. Destructure 'loading' from your Auth Context
  const { user, isAuthenticated, loading } = useAuth(); 

  // 2. Prevent redirecting while checking if the user is logged in
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <span>Loading authentication...</span>
      </div>
    );
  }

  // 3. If loading is done and they are definitely not authenticated, redirect
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; 
  }

  if (role && user?.role !== role) {
    return <Navigate to="/login" replace />;
  }

  // 4. Otherwise, let them through
  return children;
}
