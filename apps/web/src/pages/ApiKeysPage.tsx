import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import { ApiError, request, type ApiKeySummary, type CreatedApiKey } from '../lib/api';

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo conectar con la API';
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—';
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    request<ApiKeySummary[]>('/api-keys')
      .then(setKeys)
      .catch((caught) => setError(errorText(caught)));
  }, []);

  useEffect(load, [load]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const key = await request<CreatedApiKey>('/api-keys', { method: 'POST', body: { name } });
      setCreated(key);
      setCopied(false);
      setName('');
      load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
    } catch {
      setError('No se pudo copiar; selecciona la clave y cópiala a mano');
    }
  };

  const revoke = async (key: ApiKeySummary) => {
    if (!window.confirm(`¿Revocar la clave "${key.name}"?`)) return;
    setError(null);
    try {
      await request<ApiKeySummary>(`/api-keys/${key.id}`, { method: 'DELETE' });
      load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Administración</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">Claves de API</h1>
      <p className="mt-4 max-w-xl text-body-sm text-ash">
        Las claves dan acceso de solo lectura a los reportes (por ejemplo, Power BI) con el encabezado X-API-Key.
      </p>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      <Card className="mt-8 max-w-md">
        <form onSubmit={(event) => void create(event)} className="space-y-4">
          <Input
            label="Nombre"
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit">Crear clave</Button>
        </form>
      </Card>

      {created && (
        <Card className="mt-6 max-w-2xl">
          <Eyebrow>Clave creada: {created.name}</Eyebrow>
          <p className="mt-4 break-all rounded-lg border border-smoke bg-carbon px-3 py-2 font-jetbrains-mono text-body-sm">
            {created.key}
          </p>
          <p role="alert" className="mt-3 text-body-sm text-ash">
            Guárdala ahora: no volverá a mostrarse.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void copy()}>{copied ? 'Copiada' : 'Copiar'}</Button>
            <Button variant="ghost" onClick={() => setCreated(null)}>
              Ocultar
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead className="text-left text-ash">
            <tr>
              <th>Nombre</th>
              <th>Prefijo</th>
              <th>Creada</th>
              <th>Último uso</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td className="font-jetbrains-mono">{key.prefix}…</td>
                <td>{formatDate(key.createdAt)}</td>
                <td>{formatDate(key.lastUsedAt)}</td>
                <td>{key.revokedAt ? `Revocada ${formatDate(key.revokedAt)}` : 'Activa'}</td>
                <td>
                  {!key.revokedAt && (
                    <Button variant="ghost" onClick={() => void revoke(key)}>
                      Revocar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {keys.length === 0 && <p className="mt-4 text-body-sm text-ash">Aún no hay claves.</p>}
      </div>
    </main>
  );
}
