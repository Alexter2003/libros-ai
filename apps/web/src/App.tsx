import { useEffect, useState } from 'react';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Eyebrow } from './components/ui/Eyebrow';
import { API_URL, fetchHealth, type HealthReport } from './lib/api';

type HealthState = { kind: 'loading' } | { kind: 'ready'; report: HealthReport } | { kind: 'error' };

export function App() {
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
    <main className="mx-auto max-w-[1200px] px-6 py-24">
      <Eyebrow>Libros y cómics</Eyebrow>
      <h1 className="mt-6 text-display font-medium leading-[1.13] tracking-[-2.3px]">
        Tu biblioteca, con IA.
      </h1>
      <p className="mt-6 max-w-[480px] text-ash">
        Pregunta por libros y cómics, compara opciones y descubre qué leer después.
      </p>

      <Card className="mt-16 max-w-md">
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
    </main>
  );
}
