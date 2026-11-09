import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserResponse } from '../../users/user.response';
import { AiServiceResponse, toAiServiceResponse } from './ai-service.response';
import { AiServicesService } from './ai-services.service';
import { CreateAiServiceDto } from './dto/create-ai-service.dto';
import { UpdateAiServiceDto } from './dto/update-ai-service.dto';

@ApiTags('ai-services')
@ApiBearerAuth()
@Controller('ai-services')
export class AiServicesController {
  constructor(private readonly services: AiServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List AI services (admins see all, users see enabled ones)' })
  async list(@CurrentUser() actor: UserResponse): Promise<AiServiceResponse[]> {
    const services = await this.services.list(actor.role !== Role.ADMIN);
    return services.map(toAiServiceResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one AI service' })
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: UserResponse,
  ): Promise<AiServiceResponse> {
    const service = await this.services.getOrThrow(id);
    if (!service.enabled && actor.role !== Role.ADMIN) {
      throw new NotFoundException(`AI service ${id} not found`);
    }
    return toAiServiceResponse(service);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create an AI service (admin)' })
  async create(@Body() dto: CreateAiServiceDto): Promise<AiServiceResponse> {
    return toAiServiceResponse(await this.services.create(dto));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update or enable/disable an AI service (admin)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAiServiceDto,
  ): Promise<AiServiceResponse> {
    return toAiServiceResponse(await this.services.update(id, dto));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an AI service; usage history is kept (admin)' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.services.remove(id);
  }
}
