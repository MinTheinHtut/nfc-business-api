import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ProtectedRoute({ children, adminOnly = false, exhibitorOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading" role="status">Checking your session…</div>;
  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (adminOnly && user.role !== 'admin') return <Navigate to="/saved" replace />;
  if (exhibitorOnly && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}
