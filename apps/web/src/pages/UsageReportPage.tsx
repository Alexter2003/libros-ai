import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import {
  ApiError,
  rangeQuery,
  request,
  type AiServiceSummary,
  type SessionMessages,
  type SessionRow,
  type UsageRow,
  type User,
} from '../lib/api';

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo conectar con la API';
}

const selectClass =
  'mt-2 block w-full rounded-lg border border-smoke bg-carbon px-3 py-2 text-body-sm text-bone';

export function UsageReportPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<AiServiceSummary[]>([]);
  const [userId, setUserId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [opened, setOpened] = useState<SessionMessages | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([request<User[]>('/users'), request<AiServiceSummary[]>('/ai-services')])
      .then(([userList, serviceList]) => {
        setUsers(userList);
        setServices(serviceList);
      })
      .catch((caught) => setError(errorText(caught)));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [usageRows, sessionRows] = await Promise.all([
        request<UsageRow[]>(`/reports/usage${rangeQuery({ userId, serviceId, from, to })}`),
        request<SessionRow[]>(`/reports/chat-sessions${rangeQuery({ userId, from, to })}`),
      ]);
      setRows(usageRows);
      setSessions(sessionRows);
    } catch (caught) {
      setError(errorText(caught));
    }
  }, [userId, serviceId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          requests: sum.requests + row.requests,
          totalTokens: sum.totalTokens + row.totalTokens,
        }),
        { requests: 0, totalTokens: 0 },
      ),
    [rows],
  );

  const openSession = async (id: string) => {
    setError(null);
    try {
      setOpened(await request<SessionMessages>(`/reports/chat-sessions/${id}`));
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Administración</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">Reporte de uso</h1>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      <div className="mt-8 grid items-end gap-4 md:grid-cols-5">
        <label className="block">
          <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">Usuario</span>
          <select className={selectClass} value={userId} onChange={(event) => setUserId(event.target.value)}>
            <option value="">Todos</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">Servicio</span>
          <select className={selectClass} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <option value="">Todos</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <Input label="Desde" name="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="Hasta" name="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <Button
          variant="ghost"
          onClick={() => {
            setUserId('');
            setServiceId('');
            setFrom('');
            setTo('');
          }}
        >
          Limpiar
        </Button>
      </div>

      <Card className="mt-8">
        <Eyebrow>Totales del filtro</Eyebrow>
        <p className="mt-4 text-heading font-medium">
          {totals.totalTokens} tokens · {totals.requests} llamadas
        </p>
      </Card>

      <h2 className="mt-10 text-heading font-medium">Consumo por día, usuario y servicio</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead className="text-left text-ash">
            <tr>
              <th>Día (UTC)</th>
              <th>Usuario</th>
              <th>Servicio</th>
              <th>Llamadas</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.date}-${row.userId}-${row.serviceName}`}>
                <td>{row.date}</td>
                <td>{row.userEmail}</td>
                <td>{row.serviceName}</td>
                <td>{row.requests}</td>
                <td>{row.inputTokens}</td>
                <td>{row.outputTokens}</td>
                <td>{row.totalTokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="mt-4 text-body-sm text-ash">Sin consumo con estos filtros.</p>}
      </div>

      <h2 className="mt-10 text-heading font-medium">Conversaciones</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead className="text-left text-ash">
            <tr>
              <th>Usuario</th>
              <th>Título</th>
              <th>Mensajes</th>
              <th>Tokens</th>
              <th>Última actividad</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.sessionId}>
                <td>{session.userEmail}</td>
                <td>{session.title}</td>
                <td>{session.messageCount}</td>
                <td>{session.totalTokens}</td>
                <td>{new Date(session.lastActivityAt).toLocaleString()}</td>
                <td>
                  <Button variant="ghost" onClick={() => void openSession(session.sessionId)}>
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && <p className="mt-4 text-body-sm text-ash">Sin conversaciones con estos filtros.</p>}
      </div>

      {opened && (
        <Card className="mt-8">
          <div className="flex items-center justify-between">
            <Eyebrow>
              {opened.userEmail} · {opened.title}
            </Eyebrow>
            <Button variant="ghost" onClick={() => setOpened(null)}>
              Cerrar
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {opened.messages.map((message) => (
              <li key={message.id} className="text-body-sm">
                <span className="font-jetbrains-mono text-caption uppercase text-ash">{message.role}</span>
                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
