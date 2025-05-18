import { Body, Controller, Post, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TextCheckerService } from './text-checker.service';
import { TextCheckerAnalyzeRequestDto } from './dto/text-checker-analyze-request.dto';
import { Throttle } from '@nestjs/throttler';
import { TextCheckerAnalyzeResponseDto } from './dto/text-checker-analyze-response.dto';
import { TextCheckerAnalyzeResponseV2Dto } from './dto/text-checker-analyze-response-v2.dto';
import { Request } from 'express';

@ApiTags('api/text-checker')
@Controller('api/text-checker')
@Throttle({ default: { ttl: 60000, limit: 20 } })
export class TextCheckerController {
  private readonly logger = new Logger(TextCheckerController.name);

  constructor(private readonly textCheckerService: TextCheckerService) { }

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
    description: 'Submit a string of text to be analyzed for bullying content',
  })
  @ApiResponse({
    status: 200,
    description: 'Result returned after processing player answers',
    type: TextCheckerAnalyzeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async analyzeText(
    @Body() body: TextCheckerAnalyzeRequestDto,
    @Req() request: Request,
  ): Promise<TextCheckerAnalyzeResponseDto> {
    // Record the request information and enhance security monitoring
    const clientIp = request.ip || request.socket?.remoteAddress || 'Unknown';
    const origin = request.headers.origin || 'Unknown';
    const userAgent = request.headers['user-agent'] || 'Unknown';

    this.logger.log(
      `Text analysis request | IP: ${clientIp} | Origin: ${origin} | Length: ${body.text.length}`,
    );

    // Record suspicious user agents
    if (
      userAgent.includes('bot') ||
      userAgent.includes('curl') ||
      userAgent.includes('wget')
    ) {
      this.logger.warn(`Suspicious user-agent detected: ${userAgent}`);
    }

    return await this.textCheckerService.analyze(body);
  }

  /**
   * @description Submits text to the updated remote API with enhanced response format.
   * @param body - The text submission payload from the frontend.
   * @returns Enhanced result including zone classification, likelihood, comment, and suggested text.
   */
  @Post('analyze-v2')
  @ApiOperation({
    summary: 'Submit requested text and receive enhanced analysis result',
  })
  @ApiBody({
    type: TextCheckerAnalyzeRequestDto,
    description:
      'Submit a string of text to be analyzed for bullying content with enhanced feedback',
  })
  @ApiResponse({
    status: 200,
    description:
      'Enhanced analysis result with zone classification, likelihood, and feedback',
    type: TextCheckerAnalyzeResponseV2Dto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async analyzeTextV2(
    @Body() body: TextCheckerAnalyzeRequestDto,
    @Req() request: Request,
  ): Promise<TextCheckerAnalyzeResponseV2Dto> {
    // Record the request information and enhance security monitoring
    const clientIp = request.ip || request.socket?.remoteAddress || 'Unknown';
    const origin = request.headers.origin || 'Unknown';
    const userAgent = request.headers['user-agent'] || 'Unknown';

    this.logger.log(
      `Text analysis V2 request | IP: ${clientIp} | Origin: ${origin} | Length: ${body.text.length}`,
    );

    // Record suspicious user agents
    if (
      userAgent.includes('bot') ||
      userAgent.includes('curl') ||
      userAgent.includes('wget')
    ) {
      this.logger.warn(`Suspicious user-agent detected: ${userAgent}`);
    }

    return await this.textCheckerService.analyzeV2(body);
  }
}
