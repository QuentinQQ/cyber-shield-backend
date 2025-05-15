import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TextCheckerAnalyzeResponseDto {
  @ApiProperty({
    description: 'Indicates whether the analyzed text was flagged as bullying.',
    example: false,
  })
  is_bullying: boolean;

  @ApiProperty({
    description:
      'Suggested alternative text if bullying was detected, otherwise omitted.',
    example: 'Maybe try phrasing it like this instead?',
    required: false,
  })
  @IsString()
  @IsOptional()
  suggested_text?: string;
}
