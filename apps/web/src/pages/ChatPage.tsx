import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Input } from '../components/ui/Input';
import {
  ApiError,
  request,
  type AiServiceSummary,
  type ChatAnswer,
  type ChatMessage,
  type ChatSessionDetail,
  type ChatSessionSummary,
  type ChatSource,
  type QuotaStatus,
} from '../lib/api';

interface ThreadMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: ChatSource[];
  grounded: boolean;
}

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

function toThread(message: ChatMessage): ThreadMessage {
  const sources = message.sources ?? [];
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    sources,
    grounded: sources.length > 0,
  };
}

function describeQuota(quota: QuotaStatus | null): string {
  if (!quota) return '';
  if (quota.tokensRemaining === null) return `Sin límite de tokens · ${quota.tokensUsed} usados`;
  return `${quota.tokensRemaining} tokens restantes de ${quota.tokenLimit}`;
}

export function ChatPage() {
  const [services, setServices] = useState<AiServiceSummary[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshSidebar = useCallback(async () => {
    const [list, status] = await Promise.all([
      request<ChatSessionSummary[]>('/chat/sessions'),
      request<QuotaStatus>('/ai/quota'),
    ]);
    setSessions(list);
    setQuota(status);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([request<AiServiceSummary[]>('/ai-services'), refreshSidebar()])
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
  }, [refreshSidebar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [thread, sending]);

  const openSession = async (id: string) => {
    setError(null);
    try {
      const detail = await request<ChatSessionDetail>(`/chat/sessions/${id}`);
      setActiveId(detail.id);
      setThread(detail.messages.map(toThread));
    } catch (caught) {
      setError(describeError(caught));
    }
  };

  const startNew = () => {
    setActiveId(null);
    setThread([]);
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || !serviceId || sending) return;
    setError(null);
    setSending(true);
    try {
      const answer = await request<ChatAnswer>('/chat/messages', {
        method: 'POST',
        body: { message: text, serviceId, ...(activeId ? { sessionId: activeId } : {}) },
      });
      setThread((current) => [
        ...current,
        { id: `u-${current.length}`, role: 'USER', content: text, sources: [], grounded: false },
        {
          id: `a-${current.length}`,
          role: 'ASSISTANT',
          content: answer.answer,
          sources: answer.sources,
          grounded: answer.grounded,
        },
      ]);
      setActiveId(answer.sessionId);
      setQuestion('');
      await refreshSidebar();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16">
      <Eyebrow>Chat</Eyebrow>
      <h1 className="mt-6 text-display-sm font-medium leading-[1.13] tracking-[-2px]">
        Pregunta al catálogo
      </h1>
      <p className="mt-4 text-body-sm text-ash" data-testid="quota">
        {describeQuota(quota)}
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
        <aside>
          <Button onClick={startNew}>Nueva conversación</Button>
          <ul className="mt-4 space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => void openSession(session.id)}
                  className={`w-full truncate rounded-lg px-3 py-2 text-left text-body-sm ${
                    session.id === activeId ? 'bg-iron text-bone' : 'text-ash hover:text-bone'
                  }`}
                >
                  {session.title}
                </button>
              </li>
            ))}
            {sessions.length === 0 && <li className="text-caption text-ash">Aún no hay conversaciones.</li>}
          </ul>
        </aside>

        <section>
          <div className="min-h-[320px] space-y-6">
            {thread.length === 0 && (
              <p className="text-ash">Prueba con “Recomiéndame un cómic de superhéroes” o “Háblame de Dune”.</p>
            )}
            {thread.map((message) => (
              <div key={message.id} className={message.role === 'USER' ? 'text-right' : ''}>
                <p
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-left text-body-sm ${
                    message.role === 'USER' ? 'bg-iron text-bone' : 'border border-smoke text-bone'
                  }`}
                >
                  {message.content}
                </p>
                {message.role === 'ASSISTANT' && message.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">
                      Fuentes
                    </span>
                    {message.sources.map((source) => (
                      <Link
                        key={source.id}
                        to={`/catalog?q=${encodeURIComponent(source.title)}`}
                        className="rounded-full border border-smoke px-3 py-1 text-caption text-bone hover:border-soft-indigo"
                      >
                        {source.title} · {source.author}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && <p className="text-body-sm text-ash">Pensando…</p>}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p role="alert" className="mt-4 text-body-sm text-ash">
              {error}
            </p>
          )}

          <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
            <label className="block">
              <span className="font-jetbrains-mono text-caption uppercase tracking-[0.85px] text-ash">
                Servicio de IA
              </span>
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
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Pregunta"
                  name="question"
                  placeholder="Escribe tu pregunta sobre libros y cómics"
                  maxLength={1000}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={sending || !serviceId || question.trim().length === 0}>
                Enviar
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
