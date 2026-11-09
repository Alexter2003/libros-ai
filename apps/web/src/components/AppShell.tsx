import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/Button';

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="border-b border-iron bg-carbon/80">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-body-sm">
            <Link to="/" className="font-medium text-bone">
              Libros y cómics
            </Link>
            <Link to="/catalog" className="text-ash hover:text-bone">
              Catálogo
            </Link>
            <Link to="/chat" className="text-ash hover:text-bone">
              Chat
            </Link>
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/items" className="text-ash hover:text-bone">
                  Gestión de catálogo
                </Link>
                <Link to="/admin/users" className="text-ash hover:text-bone">
                  Usuarios
                </Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-ash">
              {user?.name} · <span className="font-jetbrains-mono text-caption">{user?.role}</span>
            </span>
            <Button variant="ghost" onClick={() => void logout()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
