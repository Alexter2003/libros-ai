import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import { ApiError, request, type Role, type User } from '../lib/api';

interface FormState {
  id: string | null;
  email: string;
  name: string;
  password: string;
  role: Role;
}

const emptyForm: FormState = { id: null, email: '', name: '', password: '', role: 'USER' };

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo conectar con la API';
}

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    request<User[]>('/users')
      .then(setUsers)
      .catch((caught) => setError(errorText(caught)));
  }, []);

  useEffect(load, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setFormError(null);
    try {
      if (form.id) {
        const body: Record<string, unknown> = { name: form.name, role: form.role };
        if (form.password) body.password = form.password;
        await request<User>(`/users/${form.id}`, { method: 'PATCH', body });
      } else {
        await request<User>('/users', {
          method: 'POST',
          body: { email: form.email, name: form.name, password: form.password, role: form.role },
        });
      }
      setForm(null);
      load();
    } catch (caught) {
      setFormError(
        caught instanceof ApiError && caught.status === 409
          ? 'Ese email ya está en uso'
          : errorText(caught),
      );
    }
  };

  const toggleActive = async (target: User) => {
    setError(null);
    try {
      await request<User>(`/users/${target.id}`, {
        method: 'PATCH',
        body: { active: !target.active },
      });
      load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  const remove = async (target: User) => {
    if (!window.confirm(`¿Eliminar a ${target.name}?`)) return;
    setError(null);
    try {
      await request<void>(`/users/${target.id}`, { method: 'DELETE' });
      load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Administración</Eyebrow>
      <div className="mt-6 flex items-end justify-between">
        <h1 className="text-display-sm font-medium leading-[1.13] tracking-[-2px]">Usuarios</h1>
        <Button
          onClick={() => {
            setFormError(null);
            setForm(emptyForm);
          }}
        >
          Nuevo usuario
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      {form && (
        <Card className="mt-8 max-w-md">
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <Eyebrow>{form.id ? 'Editar usuario' : 'Nuevo usuario'}</Eyebrow>
            <Input
              label="Email"
              name="email"
              type="email"
              required
              disabled={form.id !== null}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <Input
              label="Nombre"
              name="name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              label={form.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required={form.id === null}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <label className="block">
              <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">
                Rol
              </span>
              <select
                className="mt-2 block w-full rounded-lg border border-smoke bg-carbon px-3 py-2 text-body-sm text-bone disabled:text-mist"
                value={form.role}
                disabled={form.id === me?.id}
                onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((row) => {
              const isMe = row.id === me?.id;
              return (
                <tr key={row.id} className="border-b border-iron last:border-0">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 text-ash">{row.email}</td>
                  <td className="px-4 py-3 font-jetbrains-mono text-caption">{row.role}</td>
                  <td className="px-4 py-3 text-ash">{row.active ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setFormError(null);
                          setForm({ id: row.id, email: row.email, name: row.name, password: '', role: row.role });
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" disabled={isMe} onClick={() => void toggleActive(row)}>
                        {row.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button variant="ghost" disabled={isMe} onClick={() => void remove(row)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
