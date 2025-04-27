import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TextCheckerService } from './text-checker.service';
import { TextCheckerAnalyzeRequestDto } from './dto/text-checker-analyze-request.dto';
import { Throttle } from '@nestjs/throttler';
import { TextCheckerAnalyzeResponseDto } from './dto/text-checker-analyze-response.dto';

@ApiTags('api/text-checker')
@Controller('api/text-checker')
@Throttle({ default: { ttl: 60000, limit: 60 } })
export class TextCheckerController {
  constructor(private readonly textCheckerService: TextCheckerService) {}

  /**
   * @description Submits player's answers to the remote scoring API.
   * @param body - The submission payload from the frontend.
   * @returns Processed result including score, correctness and ranking.
   */
  @Post('analyze')
  @ApiOperation({
    summary: 'Submit requested text and receive checking result',
  })
  @ApiBody({
    type: TextCheckerAnalyzeRequestDto,
    description: 'Submit  a string of text to be analyzed for bullying content',
  })
  @ApiResponse({
    status: 200,
    description: 'Result returned after processing player answers',
    type: TextCheckerAnalyzeResponseDto,
  })
  async analyzeText(
    @Body() body: TextCheckerAnalyzeRequestDto,
  ): Promise<TextCheckerAnalyzeResponseDto> {
    return await this.textCheckerService.analyze(body);
  }
}
