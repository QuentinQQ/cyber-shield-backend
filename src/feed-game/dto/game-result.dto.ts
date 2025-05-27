import { IsArray, IsString, IsIn, IsNumber, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description DTO for individual submission item validation
 */
export class SubmissionItemDto {
  @ApiProperty({ 
    example: 'a1b2c3d4', 
    description: 'Obfuscated frontend comment ID' 
  })
  @IsString()
  @IsNotEmpty()
  comment_id: string;

  @ApiProperty({
    example: 'like',
    enum: ['like', 'dislike'],
    description: 'Player response',
  })
  @IsIn(['like', 'dislike'])
  response_status: 'like' | 'dislike';

  @ApiProperty({ 
    example: 3000, 
    description: 'Response time in milliseconds' 
  })
  @IsNumber()
  @IsNotEmpty()
  response_time: number;
}

/**
 * @description DTO for game result submission validation
 */
export class GameResultRequestDto {
  @ApiProperty({
    type: [SubmissionItemDto],
    example: [
      { comment_id: 'a1b2c3d4', response_status: 'like', response_time: 3000 },
      { comment_id: 'e5f6g7h8', response_status: 'dislike', response_time: 2000 },
    ],
    description: 'List of comment responses with obfuscated IDs',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionItemDto)
  submission: SubmissionItemDto[];
}