import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import {
  ApiError,
  request,
  type AiServiceSummary,
  type QuotaStatus,
  type ReadingOrderResult,
  type RecommendResult,
} from '../lib/api';

type Tab = 'recommend' | 'order';

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Alcanzaste tu límite de tokens. Pídele a un administrador que lo amplíe.';
    }
    if (error.status === 422) return 'El servicio de IA seleccionado está desactivado.';
    if (error.status === 503) return 'El modelo de IA no está disponible por ahora. Intenta de nuevo en unos minutos.';
    return error.message;
  }
  return 'No se pudo conectar con la API';
}

function describeQuota(quota: QuotaStatus | null): string {
  if (!quota) return '';
  if (quota.tokensRemaining === null) return `Sin límite de tokens · ${quota.tokensUsed} usados`;
  return `${quota.tokensRemaining} tokens restantes de ${quota.tokenLimit}`;
}

function catalogLink(title: string): string {
  return `/catalog?q=${encodeURIComponent(title)}`;
}

export function AgentsPage() {
  const [tab, setTab] = useState<Tab>('recommend');
  const [services, setServices] = useState<AiServiceSummary[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<RecommendResult | null>(null);
  const [ordered, setOrdered] = useState<ReadingOrderResult | null>(null);

  const refreshQuota = useCallback(async () => {
    setQuota(await request<QuotaStatus>('/ai/quota'));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([request<AiServiceSummary[]>('/ai-services'), refreshQuota()])
      .then(([available]) => {
        if (!active) return;
        const enabled = available.filter((service) => service.enabled);
        setServices(enabled);
        setServiceId(enabled[0]?.id ?? '');
      })
      .catch((caught) => {
        if (active) setError(describeError(caught));
      });
    return () => {
      active = false;
    };
  }, [refreshQuota]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setText('');
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !serviceId || running) return;
    setError(null);
    setRunning(true);
    try {
      if (tab === 'recommend') {
        setRecommended(
          await request<RecommendResult>('/agents/recommend', {
            method: 'POST',
            body: { description: value, serviceId },
          }),
        );
      } else {
        setOrdered(
          await request<ReadingOrderResult>('/agents/reading-order', {
            method: 'POST',
            body: { query: value, serviceId },
          }),
        );
      }
      await refreshQuota();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setRunning(false);
    }
  };

  const tabClass = (value: Tab) =>
    `rounded-lg px-4 py-2 text-body-sm ${tab === value ? 'bg-iron text-bone' : 'text-ash hover:text-bone'}`;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Agentes</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">Agentes de lectura</h1>
      <p className="mt-4 text-body-sm text-ash" data-testid="quota">
        {describeQuota(quota)}
      </p>

      <div className="mt-8 flex gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'recommend'} className={tabClass('recommend')} onClick={() => switchTab('recommend')}>
          Recomendador
        </button>
        <button type="button" role="tab" aria-selected={tab === 'order'} className={tabClass('order')} onClick={() => switchTab('order')}>
          Orden de lectura
        </button>
      </div>

      <form onSubmit={(event) => void submit(event)} className="mt-6 max-w-2xl space-y-4">
        <p className="text-body-sm text-ash">
          {tab === 'recommend'
            ? 'Cuéntame qué te gusta y te recomiendo hasta 3 títulos del catálogo.'
            : 'Escribe una serie o el título de uno de sus tomos y te digo en qué orden leerla.'}
        </p>
        <label className="block">
          <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">Servicio de IA</span>
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="mt-2 block w-full max-w-xs rounded-lg border border-smoke bg-carbon px-3 py-2 text-body-sm text-bone outline-none focus:border-soft-indigo"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          label={tab === 'recommend' ? 'Tus gustos' : 'Serie o título'}
          name="agent-input"
          placeholder={tab === 'recommend' ? 'Me gustan las historias de ciencia ficción con política' : 'Saga'}
          maxLength={tab === 'recommend' ? 1000 : 200}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" disabled={running || !serviceId || text.trim().length === 0}>
          {running ? 'Pensando…' : tab === 'recommend' ? 'Recomendar' : 'Ver orden'}
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-body-sm text-ash">
          {error}
        </p>
      )}

      {tab === 'recommend' && recommended && (
        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {recommended.recommendations.length === 0 && (
            <p className="text-ash">No encontré nada en el catálogo que encaje con esa descripción.</p>
          )}
          {recommended.recommendations.map((item) => (
            <Card key={item.id}>
              <Eyebrow>{item.kind === 'COMIC' ? 'Cómic' : 'Libro'}</Eyebrow>
              <p className="mt-4 text-heading font-medium">{item.title}</p>
              <p className="mt-1 text-body-sm text-ash">{item.author}</p>
              <p className="mt-4 text-body-sm">{item.reason}</p>
              <Link to={catalogLink(item.title)} className="mt-4 inline-block text-body-sm text-soft-indigo">
                Ver en el catálogo
              </Link>
            </Card>
          ))}
          {recommended.recommendations.length > 0 && (
            <p className="text-caption text-ash md:col-span-3">
              Tokens usados: {recommended.inputTokens + recommended.outputTokens}
            </p>
          )}
        </section>
      )}

      {tab === 'order' && ordered && (
        <section className="mt-10 max-w-2xl">
          {ordered.items.length === 0 ? (
            <p className="text-ash">{ordered.explanation}</p>
          ) : (
            <>
              <h2 className="text-heading font-medium">{ordered.series}</h2>
              <p className="mt-3 whitespace-pre-wrap text-body-sm">{ordered.explanation}</p>
              <ol className="mt-6 space-y-2">
                {ordered.items.map((item) => (
                  <li key={item.id} className="flex gap-3 text-body-sm">
                    <span className="font-jetbrains-mono text-ash">{item.position}.</span>
                    <Link to={catalogLink(item.title)} className="text-bone hover:text-soft-indigo">
                      {item.title}
                    </Link>
                    <span className="text-ash">
                      {item.author} · {item.year}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-caption text-ash">Tokens usados: {ordered.inputTokens + ordered.outputTokens}</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
