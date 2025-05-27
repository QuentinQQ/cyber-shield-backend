import { Controller, Get, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { Session } from 'express-session'; // ADDED: Import Session type
import { FeedGameService } from './feed-game.service';
// UPDATED: Import new DTOs and interfaces
import { GameResultRequestDto } from './dto/game-result.dto';
import { 
  FrontendCommentResponse 
} from './interfaces/get-all-comments.interface';
import { 
  GameResultResponse, 
  GameResultResponseV2,
  FrontendGameResultRequest 
} from './interfaces/game-result.interface';
import { GameSessionData } from './interfaces/game-session.interface'; // ADDED: Import GameSessionData

@ApiTags('Feed Game')
@Controller('feed-game')
export class FeedGameController {
  constructor(private readonly feedGameService: FeedGameService) {}

  /**
   * Get all comments with session-based ID obfuscation
   * MODIFIED: Now uses session management and returns obfuscated IDs
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
      // MODIFIED: Use new session-based method
      return await this.feedGameService.getCommentsWithSession(request.session);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch comments: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Submit comment answers with session validation
   * MODIFIED: Now validates session and uses obfuscated IDs from frontend
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
      // NEW: Convert DTO to interface for service layer
      const frontendRequest: FrontendGameResultRequest = {
        submission: gameResultRequest.submission,
      };

      // MODIFIED: Pass session for validation and ID mapping
      return await this.feedGameService.submitCommentAnswers(
        frontendRequest,
        request.session
      );
    } catch (error) {
      // NEW: Enhanced error handling with specific status codes
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
   * Submit comment answers using V2 API with enhanced response
   * MODIFIED: Same session validation as V1 with enhanced response format
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
      // NEW: Convert DTO to interface (same as V1)
      const frontendRequest: FrontendGameResultRequest = {
        submission: gameResultRequest.submission,
      };

      // MODIFIED: Use V2 service method with session validation
      return await this.feedGameService.submitCommentAnswersV2(
        frontendRequest,
        request.session
      );
    } catch (error) {
      // NEW: Same error handling as V1
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