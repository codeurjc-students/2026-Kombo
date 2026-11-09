import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';
import StatusPage from './StatusPage';

// Only shows its child routes to logged in users with one of the allowed roles.
// The server checks the same rules: this only avoids showing pages that would fail.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Comprobando tu sesión…" />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <StatusPage code="403" title="No tienes acceso a esta página" message="Tu cuenta no tiene permiso para ver este contenido." />
    );
  }
  return <Outlet />;
}
