import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ApiKey, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

class ApiKeyResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'First characters of the key, to recognise it' })
  prefix!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: Date, nullable: true })
  lastUsedAt!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  revokedAt!: Date | null;
}

class CreatedApiKeyResponse extends ApiKeyResponse {
  @ApiProperty({ description: 'The full key. It is shown only in this response.' })
  key!: string;
}

function toResponse(key: ApiKey): ApiKeyResponse {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
  };
}

@ApiTags('api-keys')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly keys: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create an API key for read-only reports; the key is returned once (admin)' })
  async create(@Body() dto: CreateApiKeyDto): Promise<CreatedApiKeyResponse> {
    const { key, plain } = await this.keys.create(dto.name);
    return { ...toResponse(key), key: plain };
  }

  @Get()
  @ApiOperation({ summary: 'List API keys without their values (admin)' })
  async list(): Promise<ApiKeyResponse[]> {
    return (await this.keys.list()).map(toResponse);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke an API key; it stops working immediately (admin)' })
  async revoke(@Param('id', ParseUUIDPipe) id: string): Promise<ApiKeyResponse> {
    return toResponse(await this.keys.revoke(id));
  }
}
