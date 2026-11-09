import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Cover } from '../components/Cover';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import { ApiError, request, type Item, type ItemPage, type Kind } from '../lib/api';

type KindFilter = Kind | 'ALL';

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'BOOK', label: 'Libros' },
  { value: 'COMIC', label: 'Cómics' },
];

const KIND_LABEL: Record<Kind, string> = { BOOK: 'Libro', COMIC: 'Cómic' };
const PAGE_SIZE = 12;

export function CatalogPage() {
  const [params] = useSearchParams();
  const initialQuery = params.get('q')?.trim() ?? '';
  const [search, setSearch] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ItemPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (kind !== 'ALL') params.set('kind', kind);
    if (query) params.set('q', query);
    let active = true;
    request<ItemPage>(`/items?${params}`)
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError(null);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'No se pudo conectar con la API');
      });
    return () => {
      active = false;
    };
  }, [page, kind, query]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Catálogo</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">
        Libros y cómics
      </h1>

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm">
          <Input
            label="Buscar"
            name="search"
            placeholder="Título, autor o serie"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={kind === filter.value ? 'primary' : 'ghost'}
              onClick={() => {
                setKind(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 text-body-sm text-ash">
          {error}
        </p>
      )}

      {result && result.data.length === 0 && !error && (
        <p className="mt-12 text-ash">No se encontraron resultados para esa búsqueda.</p>
      )}

      {result && result.data.length > 0 && (
        <>
          <p className="mt-8 text-body-sm text-ash">{result.total} resultados</p>
          <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
            {result.data.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="text-left"
              >
                <Cover title={item.title} src={item.coverUrl} />
                <p className="mt-3 text-body-sm font-medium">{item.title}</p>
                <p className="text-caption text-ash">{item.author}</p>
              </button>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-4">
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
        </>
      )}

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          className="fixed inset-0 z-10 flex items-center justify-center bg-carbon/80 p-6"
          onClick={() => setSelected(null)}
        >
          <Card
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <Cover title={selected.title} src={selected.coverUrl} />
              <div>
                <Eyebrow>{KIND_LABEL[selected.kind]}</Eyebrow>
                <h2 className="mt-3 text-heading font-medium">{selected.title}</h2>
                <p className="mt-1 text-body-sm text-ash">
                  {selected.author} · {selected.year}
                </p>
                <p className="mt-1 text-body-sm text-ash">{selected.genre}</p>
                {selected.series && (
                  <p className="mt-1 text-body-sm text-ash">
                    Serie: {selected.series}
                    {selected.issueNumber !== null && ` #${selected.issueNumber}`}
                  </p>
                )}
                {selected.isbn && (
                  <p className="mt-1 font-jetbrains-mono text-caption text-ash">ISBN {selected.isbn}</p>
                )}
                <p className="mt-4 text-body-sm">{selected.synopsis}</p>
                <Button variant="ghost" className="mt-6" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
