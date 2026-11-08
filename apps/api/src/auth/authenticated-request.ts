import { Request } from 'express';
import { UserResponse } from '../users/user.response';

export interface AuthenticatedRequest extends Request {
  user: UserResponse;
}
