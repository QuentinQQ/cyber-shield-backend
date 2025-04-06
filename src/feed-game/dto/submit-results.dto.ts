import {
  IsArray,
  IsInt,
  IsIn,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubmissionItemDto {
  @ApiProperty({ example: 2, description: 'ID of the comment being answered' })
  @IsInt()
  comment_id: number;

  @ApiProperty({
    example: 'like',
    enum: ['like', 'dislike'],
    description: 'Player response',
  })
  @IsIn(['like', 'dislike'])
  response_status: 'like' | 'dislike';

  @ApiProperty({ example: 3000, description: 'Response time in milliseconds' })
  @IsInt()
  @IsPositive()
  response_time: number;
}

export class SubmitResultsDto {
  @ApiProperty({
    type: [SubmissionItemDto],
    example: [
      { comment_id: 2, response_status: 'like', response_time: 3000 },
      { comment_id: 3, response_status: 'dislike', response_time: 2000 },
    ],
    description: 'List of comment responses submitted by player',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionItemDto)
  submission: SubmissionItemDto[];
}
