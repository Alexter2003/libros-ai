import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../users/user.response';

export class LoginResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: UserResponse })
  user!: UserResponse;
}
