import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Item, Kind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ListItemsQuery } from './dto/list-items.query';
import { UpdateItemDto } from './dto/update-item.dto';

export interface ItemPage {
  data: Item[];
  total: number;
  page: number;
  pageSize: number;
}

function assertComicOnlyFields(
  kind: Kind,
  series: string | null | undefined,
  issueNumber: number | null | undefined,
): void {
  if (kind === Kind.BOOK && (series != null || issueNumber != null)) {
    throw new BadRequestException('series and issueNumber are only allowed for comics');
  }
}

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListItemsQuery): Promise<ItemPage> {
    const where: Prisma.ItemWhereInput = {};
    if (query.kind) where.kind = query.kind;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { author: { contains: query.q, mode: 'insensitive' } },
        { series: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.item.count({ where }),
    ]);
    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  async getOrThrow(id: string): Promise<Item> {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateItemDto): Promise<Item> {
    assertComicOnlyFields(dto.kind, dto.series, dto.issueNumber);
    try {
      return await this.prisma.item.create({ data: dto });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const current = await this.getOrThrow(id);
    const kind = dto.kind ?? current.kind;
    const series = dto.series === undefined ? current.series : dto.series;
    const issueNumber = dto.issueNumber === undefined ? current.issueNumber : dto.issueNumber;
    assertComicOnlyFields(kind, series, issueNumber);
    try {
      return await this.prisma.item.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.item.delete({ where: { id } });
  }

  private mapWriteError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('An item with the same ISBN or the same title, author and kind already exists');
    }
    return error;
  }
}
