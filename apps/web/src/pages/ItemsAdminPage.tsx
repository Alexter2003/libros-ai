import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import { ApiError, request, type Item, type ItemPage, type Kind } from '../lib/api';

interface FormState {
  id: string | null;
  title: string;
  author: string;
  kind: Kind;
  genre: string;
  year: string;
  synopsis: string;
  isbn: string;
  coverUrl: string;
  series: string;
  issueNumber: string;
}

const emptyForm: FormState = {
  id: null,
  title: '',
  author: '',
  kind: 'BOOK',
  genre: '',
  year: '',
  synopsis: '',
  isbn: '',
  coverUrl: '',
  series: '',
  issueNumber: '',
};

const PAGE_SIZE = 20;

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo conectar con la API';
}

function toBody(form: FormState): Record<string, unknown> {
  const isComic = form.kind === 'COMIC';
  return {
    title: form.title,
    author: form.author,
    kind: form.kind,
    genre: form.genre,
    year: Number(form.year),
    synopsis: form.synopsis,
    isbn: form.isbn.trim() || null,
    coverUrl: form.coverUrl.trim() || null,
    series: isComic ? form.series.trim() || null : null,
    issueNumber: isComic && form.issueNumber.trim() !== '' ? Number(form.issueNumber) : null,
  };
}

export function ItemsAdminPage() {
  const [result, setResult] = useState<ItemPage | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    request<ItemPage>(`/items?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((data) => {
        setResult(data);
        setError(null);
      })
      .catch((caught) => setError(errorText(caught)));
  }, [page]);

  useEffect(load, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setFormError(null);
    try {
      await request<Item>(form.id ? `/items/${form.id}` : '/items', {
        method: form.id ? 'PATCH' : 'POST',
        body: toBody(form),
      });
      setForm(null);
      load();
    } catch (caught) {
      setFormError(
        caught instanceof ApiError && caught.status === 409
          ? 'Ya existe un ítem con ese ISBN o con el mismo título, autor y tipo'
          : errorText(caught),
      );
    }
  };

  const remove = async (target: Item) => {
    if (!window.confirm(`¿Eliminar "${target.title}"?`)) return;
    setError(null);
    try {
      await request<void>(`/items/${target.id}`, { method: 'DELETE' });
      if (result && result.data.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (caught) {
      setError(errorText(caught));
    }
  };

  const edit = (row: Item) => {
    setFormError(null);
    setForm({
      id: row.id,
      title: row.title,
      author: row.author,
      kind: row.kind,
      genre: row.genre,
      year: String(row.year),
      synopsis: row.synopsis,
      isbn: row.isbn ?? '',
      coverUrl: row.coverUrl ?? '',
      series: row.series ?? '',
      issueNumber: row.issueNumber === null ? '' : String(row.issueNumber),
    });
  };

  const set = (patch: Partial<FormState>) => form && setForm({ ...form, ...patch });
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Administración</Eyebrow>
      <div className="mt-6 flex items-end justify-between">
        <h1 className="text-display-sm font-medium leading-[1.13] tracking-[-2px]">Catálogo</h1>
        <Button
          onClick={() => {
            setFormError(null);
            setForm(emptyForm);
          }}
        >
          Nuevo ítem
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      {form && (
        <Card className="mt-8 max-w-xl">
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <Eyebrow>{form.id ? 'Editar ítem' : 'Nuevo ítem'}</Eyebrow>
            <Input label="Título" name="title" required maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} />
            <Input label="Autor" name="author" required maxLength={150} value={form.author} onChange={(e) => set({ author: e.target.value })} />
            <label className="block">
              <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">Tipo</span>
              <select
                className="mt-2 block w-full rounded-lg border border-smoke bg-carbon px-3 py-2 text-body-sm text-bone"
                value={form.kind}
                onChange={(e) => set({ kind: e.target.value as Kind })}
              >
                <option value="BOOK">Libro</option>
                <option value="COMIC">Cómic</option>
              </select>
            </label>
            <Input label="Género" name="genre" required maxLength={80} value={form.genre} onChange={(e) => set({ genre: e.target.value })} />
            <Input label="Año" name="year" type="number" required min={1400} max={2100} value={form.year} onChange={(e) => set({ year: e.target.value })} />
            <label className="block">
              <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">Sinopsis</span>
              <textarea
                required
                rows={5}
                maxLength={4000}
                className="mt-2 block w-full rounded-lg border border-smoke bg-carbon px-3 py-2 text-body-sm text-bone outline-none focus:border-soft-indigo"
                value={form.synopsis}
                onChange={(e) => set({ synopsis: e.target.value })}
              />
            </label>
            <Input label="ISBN (opcional)" name="isbn" maxLength={20} value={form.isbn} onChange={(e) => set({ isbn: e.target.value })} />
            <Input label="Portada (URL o /covers/x.webp, opcional)" name="coverUrl" maxLength={500} value={form.coverUrl} onChange={(e) => set({ coverUrl: e.target.value })} />
            {form.kind === 'COMIC' && (
              <>
                <Input label="Serie (opcional)" name="series" maxLength={150} value={form.series} onChange={(e) => set({ series: e.target.value })} />
                <Input label="Número (opcional)" name="issueNumber" type="number" min={0} value={form.issueNumber} onChange={(e) => set({ issueNumber: e.target.value })} />
              </>
            )}
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
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {result?.data.map((row) => (
              <tr key={row.id} className="border-b border-iron last:border-0">
                <td className="px-4 py-3">{row.title}</td>
                <td className="px-4 py-3 text-ash">{row.author}</td>
                <td className="px-4 py-3 font-jetbrains-mono text-caption">{row.kind}</td>
                <td className="px-4 py-3 text-ash">{row.year}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => edit(row)}>
                      Editar
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
      </Card>

      <div className="mt-6 flex items-center gap-4">
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Anterior
        </Button>
        <span className="text-body-sm text-ash">
          Página {page} de {totalPages}
        </span>
        <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Siguiente
        </Button>
      </div>
    </main>
  );
}
