import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, ValidateIf } from 'class-validator';

export class SetTokenLimitDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    description: 'Total tokens (input plus output) the user may consume. Null means unlimited.',
  })
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsInt()
  @Min(0)
  tokenLimit!: number | null;
}
