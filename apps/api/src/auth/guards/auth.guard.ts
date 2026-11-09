import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { toUserResponse } from '../../users/user.response';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { UsersService } from '../../users/users.service';
import { AuthenticatedRequest } from '../authenticated-request';
import { ALLOW_API_KEY } from '../decorators/allow-api-key.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface TokenPayload {
  sub: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const allowsApiKey = this.reflector.getAllAndOverride<boolean | undefined>(ALLOW_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const plainKey = request.headers['x-api-key'];
    if (allowsApiKey && typeof plainKey === 'string' && plainKey.length > 0) {
      const key = await this.apiKeys.authenticate(plainKey);
      if (!key) {
        throw new UnauthorizedException('Invalid or revoked API key');
      }
      (request as AuthenticatedRequest).apiKeyId = key.id;
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Account is not available');
    }
    (request as AuthenticatedRequest).user = toUserResponse(user);
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : undefined;
  }
}
