import { Injectable } from '@nestjs/common';
import { GatewayService } from '../ai/gateway/gateway.service';
import { runAgentLoop } from './agent-loop';
import { CatalogRecorder, CatalogToolsService } from './catalog-tools';
import { NO_SERIES_EXPLANATION } from './agents.constants';
import { ReadingOrderDto } from './dto/reading-order.dto';
import {
  READING_ORDER_SYSTEM_PROMPT,
  SeriesEntry,
  buildReadingOrderPrompt,
  parseReadingOrder,
  resolveReadingOrder,
} from './reading-order';

export interface ReadingOrderItem extends SeriesEntry {
  position: number;
}

export interface ReadingOrderResult {
  series: string | null;
  items: ReadingOrderItem[];
  explanation: string;
  inputTokens: number;
  outputTokens: number;
}

interface ResolvedSeries {
  name: string;
  entries: SeriesEntry[];
}

function pickSeries(recorder: CatalogRecorder, proposedName: string | null): ResolvedSeries | null {
  const name = proposedName !== null && recorder.volumesBySeries.has(proposedName) ? proposedName : recorder.lastSeries;
  const entries = name === null ? undefined : recorder.volumesBySeries.get(name);
  if (name !== null && entries) return { name, entries };
  if (recorder.standalone) return { name: recorder.standalone.title, entries: [recorder.standalone] };
  return null;
}

@Injectable()
export class ReadingOrderService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly catalog: CatalogToolsService,
  ) {}

  async order(userId: string, dto: ReadingOrderDto): Promise<ReadingOrderResult> {
    const toolkit = this.catalog.toolkit(userId);
    const loop = await runAgentLoop({
      step: (messages, tools) =>
        this.gateway.converse(userId, {
          serviceId: dto.serviceId,
          system: READING_ORDER_SYSTEM_PROMPT,
          messages,
          tools,
        }),
      tools: [toolkit.findSeries, toolkit.listSeriesVolumes],
      prompt: buildReadingOrderPrompt(dto.query),
    });
    const tokens = { inputTokens: loop.inputTokens, outputTokens: loop.outputTokens };

    const proposed = parseReadingOrder(loop.text);
    const series = pickSeries(toolkit.recorder, proposed.series);
    if (!series) {
      return { series: null, items: [], explanation: NO_SERIES_EXPLANATION, ...tokens };
    }
    const ordered = resolveReadingOrder(series.entries, proposed.order);
    return {
      series: series.name,
      items: ordered.map((entry, index) => ({ ...entry, position: index + 1 })),
      explanation: proposed.explanation,
      ...tokens,
    };
  }
}
