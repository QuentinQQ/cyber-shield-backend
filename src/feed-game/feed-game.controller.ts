import { Body, Controller, Get, Param, Post, Req, HttpException, HttpStatus } from '@nestjs/common';
import { FeedGameService } from './feed-game.service';
import { SubmitResultsDto } from './dto/submit-results.dto'; // LEGACY
import { GameResultRequestDto } from './dto/game-result.dto'; // NEW
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Session } from 'express-session';
import { GameResultResponseV2 } from './interfaces/game-result.interface'; // Legacy
import { 
  FrontendCommentResponse 
} from './interfaces/get-all-comments.interface'; // New
import { 
  GameResultResponse, 
  FrontendGameResultRequest 
} from './interfaces/game-result.interface';
import { GameSessionData } from './interfaces/game-session.interface';

@ApiTags('api/feed-game') // LEGACY
@Controller('api/feed-game') // LEGACY
@Throttle({ default: { ttl: 60000, limit: 60 } }) // LEGACY
export class FeedGameController {
  constructor(private readonly feedGameService: FeedGameService) {}
  /**
   * LEGACY
   * @description Submits player's answers to the remote scoring API.
   * @param body - The submission payload from the frontend.
   * @returns Processed result including score, correctness and ranking.
   */
  @Post('submit-answer')
  @ApiOperation({ summary: 'Submit comment answers and receive result' })
  @ApiBody({
    type: SubmitResultsDto,
    description:
      'Submit a list of comment responses with response status and time',
  })
  @ApiResponse({
    status: 200,
    description: 'Result returned after processing player answers',
    schema: {
      example: {
        score: 5,
        answered: 2,
        answered_correct: 1,
        percent: '50.0%',
        submission_id: 20,
        comparison: '76.5%',
      },
    },
  })
  async submitResults(@Body() body: SubmitResultsDto) {
    const result = await this.feedGameService.submitCommentAnswers(
      body.submission,
    );

    return {
      score: result.score,
      answered: result.answered,
      answered_correct: result.answered_cor,
      percent: result.percent,
      submission_id: result.submission_id,
      comparison: result.comparison,
    };
  }

  /**
   * LEGACY
   * @description Version 2: Submits player's answers to the remote scoring API.
   * @param body - The submission payload from the frontend.
   * @returns Processed result including mistakes,
   * problem, summary, score, answered, answered_cor, percent and submission_id
   * and comparison.
   */
  @Post('submit-answer-v2')
  @ApiOperation({
    summary: 'Submit comment answers and receive enhanced result',
  })
  @ApiBody({
    type: SubmitResultsDto,
    description:
      'Submit a list of comment responses with response status and time',
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced result returned after processing player answers',
    schema: {
      example: {
        mistakes: [
          [
            "Maybe stick to doing something else, because this just doesn't work.",
            'bullying',
          ],
          [
            'I enjoyed watching, though some parts felt a bit slow.',
            'positive',
          ],
        ],
        problem: 'general negative',
        summary:
          'Growth Area: Detecting offensive behavior. You sometimes missed comments that were actually bullying.',
        score: 5,
        answered: 3,
        answered_cor: 1,
        percent: '33.3%',
        submission_id: 144,
        comparison: '14.2%',
      },
    },
  })
  async submitResultsV2(
    @Body() body: SubmitResultsDto,
  ): Promise<GameResultResponseV2> {
    const result = await this.feedGameService.submitCommentAnswersV2(
      body.submission,
    );

    return result;
  }

  /**
   * LEGACY
   * @description Fetches a list of comments used in the game (existing logic).
   * @returns A list of game feed comments.
   */
  @Get('get-all-comments')
  @ApiOperation({ summary: 'Get all game comments' })
  @ApiResponse({ status: 200, description: 'List of comments returned' })
  async getComments() {
    return this.feedGameService.getAllComments();
  }

  /**
   * LEGACY
   * @description Fetches a list of comments used in the game (existing logic).
   * @returns A list of game feed comments.
   */
  @Get('get-all-comments-v2')
  @ApiOperation({ summary: 'Get all game comments' })
  @ApiResponse({ status: 200, description: 'List of comments returned' })
  async getCommentsV2() {
    return this.feedGameService.getAllCommentsV2();
  }


  /**
   * For new feature version
   * Get all comments with session-based ID obfuscation
   */
  @Get('comments')
  @ApiOperation({ 
    summary: 'Get all comments for the game',
    description: 'Retrieves comments with session-based ID mapping for security'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Comments retrieved successfully with obfuscated IDs',
    schema: {
      type: 'object',
      properties: {
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              comment_id: { type: 'string', description: 'Obfuscated comment ID' },
              comment_text: { type: 'string' },
              comment_fake_name: { type: 'string' }
            }
          }
        },
        session_id: { type: 'string', description: 'Session identifier' },
        total_questions: { type: 'number', description: 'Total number of questions' }
      }
    }
  })
  async getAllComments(@Req() request: Request & { session: Session & { gameData?: GameSessionData } }): Promise<FrontendCommentResponse> {
    try {
      return await this.feedGameService.getCommentsWithSession(request.session);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch comments: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * For new feature version
   * Submit comment answers with session validation
   */
  @Post('submit')
  @ApiOperation({ 
    summary: 'Submit comment responses',
    description: 'Submit user responses with session validation and duplicate prevention'
  })
  @ApiBody({ 
    type: GameResultRequestDto,
    description: 'User responses with obfuscated comment IDs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Answers submitted successfully',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        answered: { type: 'number' },
        answered_cor: { type: 'number' },
        percent: { type: 'string' },
        submission_id: { type: 'number' },
        comparison: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid IDs or duplicate submission' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - No active session found' 
  })
  async submitCommentAnswers(
    @Body() gameResultRequest: GameResultRequestDto,
    @Req() request: Request & { session: Session & { gameData?: GameSessionData } },
  ): Promise<GameResultResponse> {
    try {
      const frontendRequest: FrontendGameResultRequest = {
        submission: gameResultRequest.submission,
      };

      return await this.feedGameService.submitCommentAnswersWithSession(
        frontendRequest,
        request.session
      );
    } catch (error) {
      if (error.message.includes('No active game session')) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      if (error.message.includes('Invalid comment ID') || 
          error.message.includes('already been answered')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        `Failed to submit answers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * New feature version
   * Submit comment answers using V2 API with enhanced response
   */
  @Post('submit-v2')
  @ApiOperation({ 
    summary: 'Submit comment responses (V2 - Enhanced)',
    description: 'Submit user responses with detailed feedback and analysis'
  })
  @ApiBody({ 
    type: GameResultRequestDto,
    description: 'User responses with obfuscated comment IDs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Answers submitted successfully with detailed analysis',
    schema: {
      type: 'object',
      properties: {
        mistakes: { 
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'string' }
          },
          description: 'Array of [comment_text, comment_type] for mistakes'
        },
        problem: { type: 'string', description: 'Problem identification' },
        summary: { type: 'string', description: 'Performance summary' },
        score: { type: 'number' },
        answered: { type: 'number' },
        answered_cor: { type: 'number' },
        percent: { type: 'string' },
        submission_id: { type: 'number' },
        comparison: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid IDs or duplicate submission' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - No active session found' 
  })
  async submitCommentAnswersV2(
    @Body() gameResultRequest: GameResultRequestDto,
    @Req() request: Request & { session: Session & { gameData?: GameSessionData } },
  ): Promise<GameResultResponseV2> {
    try {
      const frontendRequest: FrontendGameResultRequest = {
        submission: gameResultRequest.submission,
      };

      return await this.feedGameService.submitCommentAnswersV2WithSession(
        frontendRequest,
        request.session
      );
    } catch (error) {
      if (error.message.includes('No active game session')) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      if (error.message.includes('Invalid comment ID') || 
          error.message.includes('already been answered')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        `Failed to submit answers to V2 API: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}