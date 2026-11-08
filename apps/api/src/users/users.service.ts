import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_COST = 10;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const admins = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    if (admins > 0) {
      return;
    }
    const email = this.config.getOrThrow<string>('ADMIN_EMAIL').trim().toLowerCase();
    const password = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    await this.create({ email, name: 'Administrator', password, role: Role.ADMIN });
    this.logger.log(`Bootstrap administrator created: ${email}`);
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  list(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async getOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await this.hashPassword(dto.password);
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, name: dto.name, passwordHash, role: dto.role },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with that email already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<User> {
    await this.getOrThrow(id);
    if (id === actorId) {
      if (dto.role === Role.USER) {
        throw new ForbiddenException('You cannot remove your own administrator role');
      }
      if (dto.active === false) {
        throw new ForbiddenException('You cannot deactivate your own account');
      }
    }
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.password !== undefined) data.passwordHash = await this.hashPassword(dto.password);
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    await this.getOrThrow(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
