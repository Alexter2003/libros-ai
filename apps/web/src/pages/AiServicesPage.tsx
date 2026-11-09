import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import { ApiError, request, type AiServiceConfig } from '../lib/api';

interface FormState {
  id: string | null;
  name: string;
  modelId: string;
  enabled: boolean;
  maxOutputTokens: string;
  temperature: string;
}

const emptyForm: FormState = {
  id: null,
  name: '',
  modelId: '',
  enabled: true,
  maxOutputTokens: '',
  temperature: '',
};

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo conectar con la API';
}

export function AiServicesPage() {
  const [services, setServices] = useState<AiServiceConfig[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    request<AiServiceConfig[]>('/ai-services')
      .then(setServices)
      .catch((caught) => setError(errorText(caught)));
  }, []);

  useEffect(load, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setFormError(null);
    const body: Record<string, unknown> = {
      name: form.name,
      modelId: form.modelId,
      enabled: form.enabled,
    };
    if (form.maxOutputTokens !== '') body.maxOutputTokens = Number(form.maxOutputTokens);
    if (form.temperature !== '') body.temperature = Number(form.temperature);
    try {
      if (form.id) {
        await request<AiServiceConfig>(`/ai-services/${form.id}`, { method: 'PATCH', body });
      } else {
        await request<AiServiceConfig>('/ai-services', { method: 'POST', body });
      }
      setForm(null);
      load();
    } catch (caught) {
      setFormError(
        caught instanceof ApiError && caught.status === 409
          ? 'Ya existe un servicio con ese nombre'
          : errorText(caught),
      );
    }
  };

  const toggle = async (target: AiServiceConfig) => {
    setError(null);
    try {
      await request<AiServiceConfig>(`/ai-services/${target.id}`, {
        method: 'PATCH',
        body: { enabled: !target.enabled },
      });
      load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  const remove = async (target: AiServiceConfig) => {
    if (!window.confirm(`¿Eliminar el servicio "${target.name}"? El historial de uso se conserva.`)) return;
    setError(null);
    try {
      await request<void>(`/ai-services/${target.id}`, { method: 'DELETE' });
      load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Administración</Eyebrow>
      <div className="mt-6 flex items-end justify-between">
        <h1 className="text-display-sm font-medium leading-[1.13] tracking-[-2px]">Servicios de IA</h1>
        <Button
          onClick={() => {
            setFormError(null);
            setForm(emptyForm);
          }}
        >
          Nuevo servicio
        </Button>
      </div>
      <p className="mt-4 max-w-xl text-body-sm text-ash">
        Un servicio desactivado rechaza las peticiones de los usuarios sin consumir tokens.
      </p>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      {form && (
        <Card className="mt-8 max-w-md">
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <Eyebrow>{form.id ? 'Editar servicio' : 'Nuevo servicio'}</Eyebrow>
            <Input
              label="Nombre"
              name="name"
              required
              maxLength={80}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              label="ID del modelo (Bedrock)"
              name="modelId"
              required
              maxLength={200}
              placeholder="us.amazon.nova-lite-v1:0"
              value={form.modelId}
              onChange={(event) => setForm({ ...form, modelId: event.target.value })}
            />
            <Input
              label="Máximo de tokens de salida (opcional)"
              name="maxOutputTokens"
              type="number"
              min={1}
              max={8192}
              step={1}
              value={form.maxOutputTokens}
              onChange={(event) => setForm({ ...form, maxOutputTokens: event.target.value })}
            />
            <Input
              label="Temperatura 0 a 1 (opcional)"
              name="temperature"
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={form.temperature}
              onChange={(event) => setForm({ ...form, temperature: event.target.value })}
            />
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
              />
              Activo
            </label>
            {formError && (
              <p role="alert" className="text-body-sm text-ash">
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mt-8 overflow-x-auto p-0">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-iron font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Salida máx.</th>
              <th className="px-4 py-3">Temp.</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {services.map((row) => (
              <tr key={row.id} className="border-b border-iron last:border-0">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 font-jetbrains-mono text-caption text-ash">{row.modelId}</td>
                <td className="px-4 py-3 text-ash">{row.maxOutputTokens ?? '—'}</td>
                <td className="px-4 py-3 text-ash">{row.temperature ?? '—'}</td>
                <td className="px-4 py-3 text-ash">{row.enabled ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFormError(null);
                        setForm({
                          id: row.id,
                          name: row.name,
                          modelId: row.modelId,
                          enabled: row.enabled,
                          maxOutputTokens: row.maxOutputTokens === null ? '' : String(row.maxOutputTokens),
                          temperature: row.temperature === null ? '' : String(row.temperature),
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button variant="ghost" onClick={() => void toggle(row)}>
                      {row.enabled ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button variant="ghost" onClick={() => void remove(row)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && <p className="px-4 py-6 text-body-sm text-ash">Aún no hay servicios.</p>}
      </Card>
    </main>
  );
}
