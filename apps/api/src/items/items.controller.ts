import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateItemDto } from './dto/create-item.dto';
import { ListItemsQuery } from './dto/list-items.query';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemListResponse, ItemResponse, toItemResponse } from './item.response';
import { ItemsService } from './items.service';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List books and comics with pagination, search and kind filter' })
  async list(@Query() query: ListItemsQuery): Promise<ItemListResponse> {
    const page = await this.items.list(query);
    return { ...page, data: page.data.map(toItemResponse) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one item' })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<ItemResponse> {
    return toItemResponse(await this.items.getOrThrow(id));
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create an item (admin)' })
  async create(@Body() dto: CreateItemDto): Promise<ItemResponse> {
    return toItemResponse(await this.items.create(dto));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an item (admin)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
  ): Promise<ItemResponse> {
    return toItemResponse(await this.items.update(id, dto));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an item (admin)' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.items.remove(id);
  }
}
