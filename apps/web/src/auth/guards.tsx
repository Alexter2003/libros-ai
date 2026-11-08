import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../lib/api';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="p-6 text-ash">Cargando…</p>;
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to="/" replace />;
}
