import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TextCheckerAnalyzeRequestDto {
  @ApiProperty({
    description: 'Text content to be analyzed for bullying',
    example: 'This is example text to analyze',
  })
  @IsString({ message: 'Text must be a string' })
  @IsNotEmpty({ message: 'Text cannot be empty' })
  @Length(3, 300, { message: 'Text must be between 3 and 300 characters' })
  @Matches(/^[^<>]*$/, {
    message: 'Text cannot contain HTML tags for security reasons',
  })
  text: string;
}
