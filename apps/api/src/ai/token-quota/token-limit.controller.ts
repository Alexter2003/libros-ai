import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserResponse, toUserResponse } from '../../users/user.response';
import { SetTokenLimitDto } from './dto/set-token-limit.dto';
import { TokenQuotaService } from './token-quota.service';

@ApiTags('users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class TokenLimitController {
  constructor(private readonly quota: TokenQuotaService) {}

  @Patch(':id/token-limit')
  @ApiOperation({ summary: 'Set or clear (null) the token limit of a user (admin)' })
  async setLimit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetTokenLimitDto,
  ): Promise<UserResponse> {
    return toUserResponse(await this.quota.setLimit(id, dto.tokenLimit));
  }
}
