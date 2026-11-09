import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ChatMessage, ChatRole, ChatSession, Prisma } from '@prisma/client';
import { AiServicesService } from '../ai/ai-services/ai-services.service';
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
import { GatewayService } from '../ai/gateway/gateway.service';
import { TokenQuotaService } from '../ai/token-quota/token-quota.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { HistoryTurn, buildRagPrompt, filterRelevant } from './rag-prompt';
import {
  HISTORY_WINDOW,
  MIN_SIMILARITY,
  NOT_ENOUGH_INFORMATION_ANSWER,
  RETRIEVAL_LIMIT,
  SESSION_TITLE_MAX_CHARS,
} from './rag.constants';

export interface ChatSource {
  id: string;
  title: string;
  author: string;
  kind: string;
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

export type SessionWithMessages = ChatSession & { messages: ChatMessage[] };

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly services: AiServicesService,
    private readonly quota: TokenQuotaService,
    private readonly embeddings: EmbeddingsService,
    private readonly gateway: GatewayService,
  ) {}

  async send(userId: string, dto: SendMessageDto): Promise<ChatAnswer> {
    const service = await this.services.getOrThrow(dto.serviceId);
    if (!service.enabled) {
      throw new UnprocessableEntityException('AI service is disabled');
    }
    const session = dto.sessionId ? await this.getOwnSession(userId, dto.sessionId) : null;
    const history = session ? await this.recentHistory(session.id) : [];
    await this.quota.assertWithinQuota(userId);

    const vector = await this.embeddings.embedQuery(userId, this.retrievalText(history, dto.message));
    const relevant = filterRelevant(await this.embeddings.search(vector, RETRIEVAL_LIMIT), MIN_SIMILARITY);

    let answer = NOT_ENOUGH_INFORMATION_ANSWER;
    let inputTokens = 0;
    let outputTokens = 0;
    if (relevant.length > 0) {
      const prompt = buildRagPrompt({ items: relevant, history, question: dto.message });
      const result = await this.gateway.generate(userId, { serviceId: dto.serviceId, prompt });
      answer = result.text;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    }

    const sources: ChatSource[] = relevant.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      kind: item.kind,
      score: item.score,
    }));
    const sessionId = await this.storeTurn(userId, session, dto.message, {
      answer,
      sources,
      inputTokens,
      outputTokens,
    });
    return { sessionId, answer, grounded: relevant.length > 0, sources, inputTokens, outputTokens };
  }

  listSessions(userId: string): Promise<ChatSession[]> {
    return this.prisma.chatSession.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  }

  async getSession(userId: string, sessionId: string): Promise<SessionWithMessages> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  private async getOwnSession(userId: string, sessionId: string): Promise<ChatSession> {
    const session = await this.prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  private async recentHistory(sessionId: string): Promise<HistoryTurn[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_WINDOW,
    });
    return rows.reverse().map((row) => ({ role: row.role, content: row.content }));
  }

  private retrievalText(history: HistoryTurn[], question: string): string {
    const lastQuestion = [...history].reverse().find((turn) => turn.role === 'USER');
    return lastQuestion ? `${lastQuestion.content}\n${question}` : question;
  }

  private async storeTurn(
    userId: string,
    session: ChatSession | null,
    question: string,
    reply: { answer: string; sources: ChatSource[]; inputTokens: number; outputTokens: number },
  ): Promise<string> {
    const asked = new Date();
    const answered = new Date(asked.getTime() + 1);
    const messages: Prisma.ChatMessageCreateWithoutSessionInput[] = [
      { role: ChatRole.USER, content: question, createdAt: asked },
      {
        role: ChatRole.ASSISTANT,
        content: reply.answer,
        sources: reply.sources as unknown as Prisma.InputJsonValue,
        inputTokens: reply.inputTokens,
        outputTokens: reply.outputTokens,
        createdAt: answered,
      },
    ];
    if (session) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { messages: { create: messages } },
      });
      return session.id;
    }
    const created = await this.prisma.chatSession.create({
      data: {
        userId,
        title: question.slice(0, SESSION_TITLE_MAX_CHARS),
        messages: { create: messages },
      },
    });
    return created.id;
  }
}
