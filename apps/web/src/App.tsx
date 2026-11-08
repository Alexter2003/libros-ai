import { Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './auth/guards';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { UsersPage } from './pages/UsersPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<MenuPage />} />
          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
