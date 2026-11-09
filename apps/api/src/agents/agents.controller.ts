import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponse } from '../users/user.response';
import { ReadingOrderDto } from './dto/reading-order.dto';
import { RecommendDto } from './dto/recommend.dto';
import { ReadingOrderService } from './reading-order.service';
import { RecommenderService } from './recommender.service';

class RecommendationResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty()
  kind!: string;

  @ApiProperty({ description: 'Why this item fits the description, in Spanish' })
  reason!: string;
}

class RecommendResponse {
  @ApiProperty({ type: [RecommendationResponse], description: 'Empty when nothing in the catalog is relevant' })
  recommendations!: RecommendationResponse[];

  @ApiProperty()
  inputTokens!: number;

  @ApiProperty()
  outputTokens!: number;
}

class ReadingOrderItemResponse {
  @ApiProperty()
  position!: number;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty()
  kind!: string;

  @ApiProperty()
  year!: number;

  @ApiProperty({ type: Number, nullable: true })
  issueNumber!: number | null;
}

class ReadingOrderResponse {
  @ApiProperty({ type: String, nullable: true })
  series!: string | null;

  @ApiProperty({ type: [ReadingOrderItemResponse] })
  items!: ReadingOrderItemResponse[];

  @ApiProperty()
  explanation!: string;

  @ApiProperty()
  inputTokens!: number;

  @ApiProperty()
  outputTokens!: number;
}

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly recommender: RecommenderService,
    private readonly readingOrder: ReadingOrderService,
  ) {}

  @Post('recommend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recommender agent: up to 3 catalog items that fit a free-text description' })
  recommend(@Body() dto: RecommendDto, @CurrentUser() actor: UserResponse): Promise<RecommendResponse> {
    return this.recommender.recommend(actor.id, dto);
  }

  @Post('reading-order')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reading-order agent: the entries of a series in reading order, with an explanation' })
  order(@Body() dto: ReadingOrderDto, @CurrentUser() actor: UserResponse): Promise<ReadingOrderResponse> {
    return this.readingOrder.order(actor.id, dto);
  }
}
