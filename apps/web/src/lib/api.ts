export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface HealthReport {
  status: 'ok' | 'error';
  database: 'up' | 'down';
}

export async function fetchHealth(): Promise<HealthReport> {
  const response = await fetch(`${API_URL}/health`);
  const body = (await response.json()) as HealthReport;
  return body;
}
