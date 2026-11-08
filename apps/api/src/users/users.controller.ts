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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse, toUserResponse } from './user.response';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  async list(): Promise<UserResponse[]> {
    return (await this.users.list()).map(toUserResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user (admin)' })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponse> {
    return toUserResponse(await this.users.getOrThrow(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a user (admin)' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return toUserResponse(await this.users.create(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name, role, active flag or password (admin)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: UserResponse,
  ): Promise<UserResponse> {
    return toUserResponse(await this.users.update(id, dto, actor.id));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a user (admin)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: UserResponse,
  ): Promise<void> {
    await this.users.remove(id, actor.id);
  }
}
