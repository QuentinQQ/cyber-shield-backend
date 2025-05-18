import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TextCheckerAnalyzeResponseV2Dto {
  @ApiProperty({
    description:
      'The zone classification of the analyzed text (Green/Yellow/Orange/Red)',
    example: 'Green Zone',
  })
  @IsString()
  zone: string;

  @ApiProperty({
    description: 'The likelihood of bullying in the analyzed text',
    example: 'Low likelihood of bullying',
  })
  @IsString()
  likelihood: string;

  @ApiProperty({
    description: 'Comment or feedback on the analyzed text',
    example: 'Looks good! No red flags here. Nice one!',
  })
  @IsString()
  comment: string;

  @ApiProperty({
    description: 'Suggested alternative text if needed, "None" if not needed',
    example: 'None',
  })
  @IsString()
  suggested_text: string;

  @ApiProperty({
    description: 'Numeric representation of bullying severity level (1-4)',
    example: 1,
    enum: [1, 2, 3, 4],
  })
  @IsNumber()
  bullying_level: number;
}
