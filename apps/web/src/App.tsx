import { Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './auth/guards';
import { AppShell } from './components/AppShell';
import { AgentsPage } from './pages/AgentsPage';
import { ChatPage } from './pages/ChatPage';
import { CatalogPage } from './pages/CatalogPage';
import { ItemsAdminPage } from './pages/ItemsAdminPage';
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
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/items" element={<ItemsAdminPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
