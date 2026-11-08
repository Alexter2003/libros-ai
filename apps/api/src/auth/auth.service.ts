import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { toUserResponse } from '../users/user.response';
import { UsersService } from '../users/users.service';
import { LoginResponse } from './dto/login.response';

const INVALID_CREDENTIALS = 'Invalid email or password';

@Injectable()
export class AuthService {
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      await bcrypt.compare(password, await this.getDummyHash());
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches || !user.active) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken, user: toUserResponse(user) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.users.hashPassword('dummy-password-for-timing');
    return this.dummyHash;
  }
}
