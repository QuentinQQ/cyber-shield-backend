import { IsNotEmpty, IsString } from 'class-validator';

export class TextCheckerAnalyzeRequestDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
