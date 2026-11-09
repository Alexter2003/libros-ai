import { BadRequestException } from '@nestjs/common';

export interface UsageReportRow {
  date: string;
  userId: string;
  userEmail: string;
  serviceName: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface UsageTotals {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ServiceTotals extends UsageTotals {
  serviceName: string;
}

export interface DayTotals extends UsageTotals {
  date: string;
}

export interface UsageSummary {
  totals: UsageTotals;
  byService: ServiceTotals[];
  byDay: DayTotals[];
}

export interface DateRange {
  from: Date | null;
  toExclusive: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(value: string, label: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${label} is not a valid date`);
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

export function parseRange(from?: string, to?: string): DateRange {
  const start = from ? startOfUtcDay(from, 'from') : null;
  const end = to ? startOfUtcDay(to, 'to') : null;
  if (start && end && start.getTime() > end.getTime()) {
    throw new BadRequestException('from must not be later than to');
  }
  return { from: start, toExclusive: end ? new Date(end.getTime() + DAY_MS) : null };
}

function emptyTotals(): UsageTotals {
  return { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

function add(target: UsageTotals, row: UsageReportRow): void {
  target.requests += row.requests;
  target.inputTokens += row.inputTokens;
  target.outputTokens += row.outputTokens;
  target.totalTokens += row.totalTokens;
}

export function summarize(rows: UsageReportRow[]): UsageSummary {
  const totals = emptyTotals();
  const services = new Map<string, ServiceTotals>();
  const days = new Map<string, DayTotals>();
  for (const row of rows) {
    add(totals, row);
    const service = services.get(row.serviceName) ?? { serviceName: row.serviceName, ...emptyTotals() };
    add(service, row);
    services.set(row.serviceName, service);
    const day = days.get(row.date) ?? { date: row.date, ...emptyTotals() };
    add(day, row);
    days.set(row.date, day);
  }
  return {
    totals,
    byService: [...services.values()].sort((a, b) => b.totalTokens - a.totalTokens),
    byDay: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
