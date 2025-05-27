import { IsArray, IsString, IsIn, IsNumber, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @description DTO for individual submission item validation
 */
export class SubmissionItemDto {
  @IsString()
  @IsNotEmpty()
  comment_id: string; // Frontend obfuscated ID

  @IsIn(['like', 'dislike'])
  response_status: 'like' | 'dislike';

  @IsNumber()
  @IsNotEmpty()
  response_time: number;
}

/**
 * @description DTO for game result submission validation
 */
export class GameResultRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionItemDto)
  submission: SubmissionItemDto[];
}