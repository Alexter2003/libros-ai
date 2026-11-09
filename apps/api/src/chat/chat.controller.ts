import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponse } from '../users/user.response';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

class SourceResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty()
  kind!: string;

  @ApiProperty({ description: 'Cosine similarity between the question and the item' })
  score!: number;
}

class ChatAnswerResponse {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  answer!: string;

  @ApiProperty({ description: 'False when the catalog did not have enough information' })
  grounded!: boolean;

  @ApiProperty({ type: [SourceResponse] })
  sources!: SourceResponse[];

  @ApiProperty()
  inputTokens!: number;

  @ApiProperty()
  outputTokens!: number;
}

class SessionSummaryResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class MessageResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT'] })
  role!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: [SourceResponse], nullable: true })
  sources!: SourceResponse[] | null;

  @ApiProperty({ type: Number, nullable: true })
  inputTokens!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  outputTokens!: number | null;

  @ApiProperty()
  createdAt!: Date;
}

class SessionDetailResponse extends SessionSummaryResponse {
  @ApiProperty({ type: [MessageResponse] })
  messages!: MessageResponse[];
}

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('messages')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ask the catalog chatbot; answers cite their sources and count against the token limit' })
  send(@Body() dto: SendMessageDto, @CurrentUser() actor: UserResponse): Promise<ChatAnswerResponse> {
    return this.chat.send(actor.id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List my chat sessions, most recent first' })
  async sessions(@CurrentUser() actor: UserResponse): Promise<SessionSummaryResponse[]> {
    const sessions = await this.chat.listSessions(actor.id);
    return sessions.map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }));
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Read one of my chat sessions with its messages' })
  async session(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: UserResponse,
  ): Promise<SessionDetailResponse> {
    const session = await this.chat.getSession(actor.id, id);
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: session.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        sources: message.sources as SourceResponse[] | null,
        inputTokens: message.inputTokens,
        outputTokens: message.outputTokens,
        createdAt: message.createdAt,
      })),
    };
  }
}
