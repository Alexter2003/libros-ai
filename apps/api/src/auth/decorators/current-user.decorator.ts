import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../authenticated-request';
import { UserResponse } from '../../users/user.response';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserResponse =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
