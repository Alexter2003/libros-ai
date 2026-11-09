import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { API_URL, fetchHealth, type HealthReport } from '../lib/api';

type HealthState = { kind: 'loading' } | { kind: 'ready'; report: HealthReport } | { kind: 'error' };

export function MenuPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' });

  const load = () => {
    setHealth({ kind: 'loading' });
    fetchHealth()
      .then((report) => setHealth({ kind: 'ready', report }))
      .catch(() => setHealth({ kind: 'error' }));
  };

  useEffect(load, []);

  const healthy = health.kind === 'ready' && health.report.status === 'ok';

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Menú principal</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">
        Hola, {user?.name}.
      </h1>
      <p className="mt-6 max-w-[480px] text-ash">
        Pregunta por libros y cómics, compara opciones y descubre qué leer después.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <Eyebrow>Catálogo</Eyebrow>
          <p className="mt-4 text-heading font-medium">Libros y cómics</p>
          <p className="mt-2 text-body-sm text-ash">Busca, filtra y consulta los títulos disponibles.</p>
          <Link to="/catalog" className="mt-6 inline-block">
            <Button>Ver catálogo</Button>
          </Link>
        </Card>
        <Card>
          <Eyebrow>Asistente</Eyebrow>
          <p className="mt-4 text-heading font-medium">Chat del catálogo</p>
          <p className="mt-2 text-body-sm text-ash">Pregunta por libros y cómics y consulta las fuentes de cada respuesta.</p>
          <Link to="/chat" className="mt-6 inline-block">
            <Button>Abrir chat</Button>
          </Link>
        </Card>
        <Card>
          <Eyebrow>Agentes</Eyebrow>
          <p className="mt-4 text-heading font-medium">Recomendador y orden de lectura</p>
          <p className="mt-2 text-body-sm text-ash">Recibe recomendaciones a tu gusto y descubre en qué orden leer una serie.</p>
          <Link to="/agents" className="mt-6 inline-block">
            <Button>Abrir agentes</Button>
          </Link>
        </Card>
        <Card>
          <Eyebrow>Mi cuenta</Eyebrow>
          <p className="mt-4 text-heading font-medium">Mi consumo</p>
          <p className="mt-2 text-body-sm text-ash">Revisa tus tokens, tu consumo por servicio y tus conversaciones.</p>
          <Link to="/usage" className="mt-6 inline-block">
            <Button>Ver consumo</Button>
          </Link>
        </Card>
        {user?.role === 'ADMIN' && (
          <>
            <Card>
              <Eyebrow>Administración</Eyebrow>
              <p className="mt-4 text-heading font-medium">Gestión de catálogo</p>
              <p className="mt-2 text-body-sm text-ash">Crea, edita y elimina libros y cómics.</p>
              <Link to="/admin/items" className="mt-6 inline-block">
                <Button>Gestionar catálogo</Button>
              </Link>
            </Card>
            <Card>
              <Eyebrow>Administración</Eyebrow>
              <p className="mt-4 text-heading font-medium">Usuarios</p>
              <p className="mt-2 text-body-sm text-ash">Crea, edita y desactiva cuentas.</p>
              <Link to="/admin/users" className="mt-6 inline-block">
                <Button>Gestionar usuarios</Button>
              </Link>
            </Card>
            <Card>
              <Eyebrow>Administración</Eyebrow>
              <p className="mt-4 text-heading font-medium">Reporte de uso</p>
              <p className="mt-2 text-body-sm text-ash">Consumo y conversaciones de todos los usuarios, con filtros.</p>
              <Link to="/admin/usage" className="mt-6 inline-block">
                <Button>Abrir reporte</Button>
              </Link>
            </Card>
            <Card>
              <Eyebrow>Administración</Eyebrow>
              <p className="mt-4 text-heading font-medium">Claves de API</p>
              <p className="mt-2 text-body-sm text-ash">Crea y revoca claves de solo lectura para Power BI.</p>
              <Link to="/admin/api-keys" className="mt-6 inline-block">
                <Button>Gestionar claves</Button>
              </Link>
            </Card>
          </>
        )}
        <Card>
          <Eyebrow>Estado de la API</Eyebrow>
          <p className="mt-4 text-heading font-medium">
            {health.kind === 'loading' && 'Comprobando…'}
            {health.kind === 'error' && 'Sin conexión'}
            {health.kind === 'ready' && (healthy ? 'healthy' : 'degradada')}
          </p>
          {health.kind === 'ready' && (
            <p className="mt-2 text-body-sm text-ash">Base de datos: {health.report.database}</p>
          )}
          <div className="mt-6 flex gap-2">
            <Button onClick={load}>Reintentar</Button>
            <Button variant="ghost" onClick={() => window.open(`${API_URL}/docs`, '_blank')}>
              Ver documentación
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
