import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import {
  ApiError,
  rangeQuery,
  request,
  type ChatSessionSummary,
  type OwnUsage,
} from '../lib/api';

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo conectar con la API';
}

export function UsagePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [usage, setUsage] = useState<OwnUsage | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [own, list] = await Promise.all([
        request<OwnUsage>(`/usage/me${rangeQuery({ from, to })}`),
        request<ChatSessionSummary[]>('/chat/sessions'),
      ]);
      setUsage(own);
      setSessions(list);
    } catch (caught) {
      setError(errorText(caught));
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const quota = usage?.quota;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Mi cuenta</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">Mi consumo</h1>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <Eyebrow>Límite</Eyebrow>
          <p className="mt-4 text-heading font-medium">{quota ? (quota.tokenLimit ?? 'Sin límite') : '…'}</p>
        </Card>
        <Card>
          <Eyebrow>Usados</Eyebrow>
          <p className="mt-4 text-heading font-medium">{quota?.tokensUsed ?? '…'}</p>
        </Card>
        <Card>
          <Eyebrow>Restantes</Eyebrow>
          <p className="mt-4 text-heading font-medium">
            {quota ? (quota.tokensRemaining ?? 'Sin límite') : '…'}
          </p>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap items-end gap-4">
        <Input label="Desde" name="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="Hasta" name="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <Button
          variant="ghost"
          onClick={() => {
            setFrom('');
            setTo('');
          }}
        >
          Limpiar
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <Eyebrow>Por servicio</Eyebrow>
          <table className="mt-4 w-full text-body-sm">
            <thead className="text-left text-ash">
              <tr>
                <th>Servicio</th>
                <th>Llamadas</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {usage?.byService.map((row) => (
                <tr key={row.serviceName}>
                  <td>{row.serviceName}</td>
                  <td>{row.requests}</td>
                  <td>{row.totalTokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {usage && usage.byService.length === 0 && <p className="mt-4 text-body-sm text-ash">Sin consumo en el periodo.</p>}
        </Card>
        <Card>
          <Eyebrow>Por día (UTC)</Eyebrow>
          <table className="mt-4 w-full text-body-sm">
            <thead className="text-left text-ash">
              <tr>
                <th>Día</th>
                <th>Llamadas</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {usage?.byDay.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.requests}</td>
                  <td>{row.totalTokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {usage && usage.byDay.length === 0 && <p className="mt-4 text-body-sm text-ash">Sin consumo en el periodo.</p>}
        </Card>
      </div>

      <h2 className="mt-12 text-heading font-medium">Mis conversaciones</h2>
      <ul className="mt-4 space-y-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link to={`/chat?session=${session.id}`} className="text-body-sm text-bone hover:underline">
              {session.title}
            </Link>
            <span className="ml-3 text-caption text-ash">{new Date(session.updatedAt).toLocaleString()}</span>
          </li>
        ))}
        {sessions.length === 0 && <li className="text-body-sm text-ash">Aún no hay conversaciones.</li>}
      </ul>
    </main>
  );
}
