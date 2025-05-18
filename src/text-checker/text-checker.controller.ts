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
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Record the request information and enhance security monitoring
    const clientIp = request.ip || request.socket?.remoteAddress || 'Unknown';
    const origin = request.headers.origin || 'Unknown';
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const referer = request.headers.referer || 'None';
    const contentType = request.headers['content-type'] || 'None';
    const acceptLanguage = request.headers['accept-language'] || 'None';

    this.logger.log(
      `[${requestId}] Text analysis request | IP: ${clientIp} | Origin: ${origin} | Length: ${body.text.length} | User-Agent: ${userAgent} | Referer: ${referer} | Content-Type: ${contentType} | Accept-Language: ${acceptLanguage}`,
    );

    // Record suspicious user agents
    if (
      userAgent.includes('bot') ||
      userAgent.includes('curl') ||
      userAgent.includes('wget') ||
      userAgent.includes('python') ||
      userAgent.includes('postman') ||
      userAgent.includes('scanner')
    ) {
      this.logger.warn(
        `[${requestId}] Suspicious user-agent detected: ${userAgent}`,
      );
    }

    try {
      // Call the service for analysis
      const result = await this.textCheckerService.analyze(body, requestId);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `[${requestId}] Text analysis completed | Processing Time: ${processingTime}ms | Is Bullying: ${result.is_bullying} | Has Suggestion: ${!!result.suggested_text}`,
      );

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `[${requestId}] Text analysis failed | Processing Time: ${processingTime}ms | Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
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
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Record the request information and enhance security monitoring
    const clientIp = request.ip || request.socket?.remoteAddress || 'Unknown';
    const origin = request.headers.origin || 'Unknown';
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const referer = request.headers.referer || 'None';
    const contentType = request.headers['content-type'] || 'None';
    const acceptLanguage = request.headers['accept-language'] || 'None';

    this.logger.log(
      `[${requestId}] Text analysis V2 request | IP: ${clientIp} | Origin: ${origin} | Length: ${body.text.length} | User-Agent: ${userAgent} | Referer: ${referer} | Content-Type: ${contentType} | Accept-Language: ${acceptLanguage}`,
    );

    // Record suspicious user agents
    if (
      userAgent.includes('bot') ||
      userAgent.includes('curl') ||
      userAgent.includes('wget') ||
      userAgent.includes('python') ||
      userAgent.includes('postman') ||
      userAgent.includes('scanner')
    ) {
      this.logger.warn(
        `[${requestId}] Suspicious user-agent detected: ${userAgent}`,
      );
    }

    try {
      // Call the service for analysis
      const result = await this.textCheckerService.analyzeV2(body, requestId);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `[${requestId}] Text analysis V2 completed | Processing Time: ${processingTime}ms | Zone: ${result.zone} | Bullying Level: ${result.bullying_level} | Likelihood: ${result.likelihood}`,
      );

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `[${requestId}] Text analysis V2 failed | Processing Time: ${processingTime}ms | Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Generates a unique request ID for tracking
   * @returns A string formatted as a UUID
   */
  private generateRequestId(): string {
    return (
      'req_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
