import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { UsageReportRow, parseRange, summarize } from '../../src/usage/usage-aggregation';

function row(date: string, serviceName: string, input: number, output: number, requests = 1): UsageReportRow {
  return {
    date,
    userId: 'u1',
    userEmail: 'u1@example.com',
    serviceName,
    requests,
    inputTokens: input,
    outputTokens: output,
    totalTokens: input + output,
  };
}

describe('summarize', () => {
  it('sums totals, per service and per day', () => {
    const summary = summarize([
      row('2026-11-01', 'chat', 10, 20),
      row('2026-11-01', 'agents', 5, 5, 2),
      row('2026-11-02', 'chat', 1, 2),
    ]);
    expect(summary.totals).toEqual({ requests: 4, inputTokens: 16, outputTokens: 27, totalTokens: 43 });
    expect(summary.byService.map((s) => [s.serviceName, s.totalTokens])).toEqual([
      ['chat', 33],
      ['agents', 10],
    ]);
    expect(summary.byDay.map((d) => [d.date, d.totalTokens])).toEqual([
      ['2026-11-01', 40],
      ['2026-11-02', 3],
    ]);
  });

  it('returns zeros for no rows', () => {
    const summary = summarize([]);
    expect(summary.totals.totalTokens).toBe(0);
    expect(summary.byService).toEqual([]);
    expect(summary.byDay).toEqual([]);
  });
});

describe('parseRange', () => {
  it('makes the end date inclusive', () => {
    const range = parseRange('2026-11-01', '2026-11-03');
    expect(range.from?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(range.toExclusive?.toISOString()).toBe('2026-11-04T00:00:00.000Z');
  });

  it('allows open ranges', () => {
    expect(parseRange()).toEqual({ from: null, toExclusive: null });
  });

  it('rejects a start later than the end', () => {
    expect(() => parseRange('2026-11-05', '2026-11-01')).toThrow(BadRequestException);
  });
});
