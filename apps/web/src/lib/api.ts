export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'libros.token';

export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  tokenLimit: number | null;
  createdAt: string;
}

export type Kind = 'BOOK' | 'COMIC';

export interface Item {
  id: string;
  title: string;
  author: string;
  kind: Kind;
  genre: string;
  year: number;
  synopsis: string;
  isbn: string | null;
  coverUrl: string | null;
  series: string | null;
  issueNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemPage {
  data: Item[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthReport {
  status: 'ok' | 'error';
  database: 'up' | 'down';
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    return;
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getStoredToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && auth) {
    onUnauthorized?.();
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, extractMessage(payload, `Request failed (${response.status})`));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function fetchHealth(): Promise<HealthReport> {
  return request<HealthReport>('/health', { auth: false });
}

export interface AiServiceSummary {
  id: string;
  name: string;
  enabled: boolean;
}

export interface QuotaStatus {
  tokenLimit: number | null;
  tokensUsed: number;
  tokensRemaining: number | null;
}

export interface ChatSource {
  id: string;
  title: string;
  author: string;
  kind: Kind;
  score: number;
}

export interface ChatAnswer {
  sessionId: string;
  answer: string;
  grounded: boolean;
  sources: ChatSource[];
  inputTokens: number;
  outputTokens: number;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: ChatSource[] | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatMessage[];
}

export interface AgentRecommendation {
  id: string;
  title: string;
  author: string;
  kind: Kind;
  reason: string;
}

export interface RecommendResult {
  recommendations: AgentRecommendation[];
  inputTokens: number;
  outputTokens: number;
}

export interface ReadingOrderItem {
  position: number;
  id: string;
  title: string;
  author: string;
  kind: Kind;
  year: number;
  issueNumber: number | null;
}

export interface ReadingOrderResult {
  series: string | null;
  items: ReadingOrderItem[];
  explanation: string;
  inputTokens: number;
  outputTokens: number;
}
