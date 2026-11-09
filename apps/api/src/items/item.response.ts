import { ApiProperty } from '@nestjs/swagger';
import { Item, Kind } from '@prisma/client';

export class ItemResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty({ enum: Kind })
  kind!: Kind;

  @ApiProperty()
  genre!: string;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  synopsis!: string;

  @ApiProperty({ nullable: true, type: String })
  isbn!: string | null;

  @ApiProperty({ nullable: true, type: String })
  coverUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  series!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  issueNumber!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ItemListResponse {
  @ApiProperty({ type: [ItemResponse] })
  data!: ItemResponse[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export function toItemResponse(item: Item): ItemResponse {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    kind: item.kind,
    genre: item.genre,
    year: item.year,
    synopsis: item.synopsis,
    isbn: item.isbn,
    coverUrl: item.coverUrl,
    series: item.series,
    issueNumber: item.issueNumber,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
