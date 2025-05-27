import { Injectable, Logger, HttpStatus, HttpException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Session } from 'express-session';
import {
  GameResultRequest,
  GameResultResponse,
  GameResultResponseV2,
} from './interfaces/game-result.interface'; // LEGACY
import {
  InternalSubmissionItem,
  FrontendGameResultRequest 
} from './interfaces/game-result.interface'; // New
import {
  RawApiResponse,
  RawComment,
  FrontendComment, 
  FrontendCommentResponse 
} from './interfaces/get-all-comments.interface';
import { GameSessionData } from './interfaces/game-session.interface';
import { SessionUtils } from './utils/session.utils';

/**
 * @description Service responsible for communicating with remote result API.
 */
@Injectable()
export class FeedGameService {
  private readonly logger = new Logger(FeedGameService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * LEGACY
   * @description Submit player's answers to remote API and return result.
   * @param submission - An array of submitted answers from the player.
   * @returns Remote game result including score, percent correct, and comparison.
   * @throws HttpException with generic message if remote API call fails.
   */
  async submitCommentAnswers(
    submission: GameResultRequest['submission'],
  ): Promise<GameResultResponse> {
    const url = this.configService.get<string>('SUBMIT_ANSWERS_API_URL');
    if (!url) {
      this.logger.error(
        'Configuration error: SUBMIT_ANSWERS_API_URL is not set',
      );
      throw new HttpException(
        'Unable to process submission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const body: GameResultRequest = { submission };

    try {
      const response = await firstValueFrom(
        this.httpService.post<GameResultResponse>(url, body).pipe(
          timeout(10000),
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to submit answers to ${url}: ${
                error.response?.status
              } ${error.message}`,
              error.stack,
            );
            return throwError(() => new Error('Request failed'));
          }),
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'submitCommentAnswers failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        'Unable to process submission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * LEGACY
   * @description Submit player's answers to V2 remote API with enhanced feedback.
   * @param submission - An array of submitted answers from the player.
   * @returns Enhanced remote game result including mistakes, problem areas, and summary.
   * @throws HttpException with generic message if remote API call fails.
   */
  async submitCommentAnswersV2(
    submission: GameResultRequest['submission'],
  ): Promise<GameResultResponseV2> {
    const url = this.configService.get<string>('SUBMIT_ANSWERS_API_URL_V2');
    if (!url) {
      this.logger.error(
        'Configuration error: SUBMIT_ANSWERS_API_URL_V2 is not set',
      );
      throw new HttpException(
        'Unable to process submission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const body: GameResultRequest = { submission };

    try {
      const response = await firstValueFrom(
        this.httpService.post<GameResultResponseV2>(url, body).pipe(
          timeout(10000),
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to submit answers to V2 API at ${url}: ${
                error.response?.status
              } ${error.message}`,
              error.stack,
            );
            return throwError(() => new Error('Request failed'));
          }),
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'submitCommentAnswersV2 failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        'Unable to process submission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * LEGACY
   * @description Fetch all raw comments from remote API configured in environment.
   * @returns An object with success status, data if available, message and HTTP status code.
   */
  async getAllComments(): Promise<{
    success: boolean;
    data?: RawComment[];
    message: string;
    statusCode: number;
  }> {
    try {
      const apiUrl = this.configService.get<string>('GET_ALL_COMMENTS_API_URL');
      if (!apiUrl) {
        this.logger.error(
          'Configuration error: GET_ALL_COMMENTS_API_URL is not set',
        );
        return {
          success: false,
          message: 'Unable to fetch comments',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      const response = await firstValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to fetch comments from ${apiUrl}: ${
                error.response?.status
              } ${error.message}`,
              error.stack,
            );
            return throwError(() => new Error('Request failed'));
          }),
        ),
      );

      if (!response.data || !Array.isArray(response.data.Comments)) {
        this.logger.error(
          `Invalid response format from ${apiUrl}: ${
            response.data ? JSON.stringify(response.data) : 'No data'
          }`,
        );
        return {
          success: false,
          message: 'Unable to fetch comments',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      return {
        success: true,
        data: response.data.Comments,
        message: 'Comments fetched successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger.error('Failed to fetch comments', err.stack || String(err));
      return {
        success: false,
        message: 'Unable to fetch comments',
        statusCode: err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * LEGACY
   * @description Fetch all raw comments from V2 remote API configured in environment.
   * @returns An object with success status, data if available, message and HTTP status code.
   */
  async getAllCommentsV2(): Promise<{
    success: boolean;
    data?: RawComment[];
    message: string;
    statusCode: number;
  }> {
    try {
      const apiUrl = this.configService.get<string>(
        'GET_ALL_COMMENTS_API_URL_V2',
      );
      if (!apiUrl) {
        this.logger.error(
          'Configuration error: GET_ALL_COMMENTS_API_URL_V2 is not set',
        );
        return {
          success: false,
          message: 'Unable to fetch comments',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      const response = await firstValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to fetch V2 comments from ${apiUrl}: ${
                error.response?.status
              } ${error.message}`,
              error.stack,
            );
            return throwError(() => new Error('Request failed'));
          }),
        ),
      );

      if (!response.data || !Array.isArray(response.data.Comments)) {
        this.logger.error(
          `Invalid response format from ${apiUrl}: ${
            response.data ? JSON.stringify(response.data) : 'No data'
          }`,
        );
        return {
          success: false,
          message: 'Unable to fetch comments',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      return {
        success: true,
        data: response.data.Comments,
        message: 'Comments fetched successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger.error(
        'Failed to fetch V2 comments',
        err.stack || String(err),
      );
      return {
        success: false,
        message: 'Unable to fetch comments',
        statusCode: err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }


  /**
   * For new feature which import session and redis
   * Session-based method with ID mapping and obfuscation
   * Fetch comments from external API and set up session mapping
   */
  async getCommentsWithSession(session: Session & { gameData?: GameSessionData }): Promise<FrontendCommentResponse> {
    // Initialize or get existing game session data
    if (!session.gameData) {
      session.gameData = SessionUtils.initializeGameSession();
    }

    const apiUrl = this.configService.get<string>('GET_ALL_COMMENTS_API_URL');
    if (!apiUrl) {
      throw new Error('GET_ALL_COMMENTS_API_URL is not configured');
    }

    try {
      // Fetch data from external API (same as legacy method)
      const response = await lastValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl)
      );

      const rawComments = response.data.Comments;
      
      // Generate frontend IDs and create mappings
      const frontendComments: FrontendComment[] = rawComments.map(comment => {
        const frontendId = SessionUtils.generateFrontendId();
        const realId = comment.comment_id;

        // Store bidirectional mapping in session
        session.gameData!.commentIdMap[frontendId] = realId;
        session.gameData!.reverseCommentIdMap[realId] = frontendId;
        session.gameData!.activeSessionCommentIds.push(frontendId);

        return {
          comment_id: frontendId, // Use obfuscated ID
          comment_text: comment.comment_text,
          comment_fake_name: comment.comment_fake_name,
        };
      });

      // Update session metadata
      session.gameData.questionsShown = frontendComments.length;

      // Return structured response with session info
      return {
        comments: frontendComments,
        session_id: session.id || 'anonymous',
        total_questions: frontendComments.length,
      };

    } catch (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }
  }

  /**
   * For new feature which import session and redis
   * Submit comment answers with session validation and ID mapping
   */
  async submitCommentAnswersWithSession(
    frontendRequest: FrontendGameResultRequest,
    session: Session & { gameData?: GameSessionData }
  ): Promise<GameResultResponse> {
    // Validate session exists and has game data
    if (!session.gameData) {
      throw new UnauthorizedException('No active game session found');
    }

    const gameData: GameSessionData = session.gameData;
    
    // Validate all frontend IDs are in current session scope
    for (const item of frontendRequest.submission) {
      if (!SessionUtils.isValidFrontendId(gameData, item.comment_id)) {
        throw new BadRequestException(
          `Invalid comment ID: ${item.comment_id} not found in current session`
        );
      }

      // Check for duplicate submissions
      if (SessionUtils.isAlreadyAnswered(gameData, item.comment_id)) {
        throw new BadRequestException(
          `Comment ID: ${item.comment_id} has already been answered`
        );
      }
    }

    // Convert frontend IDs to real database IDs
    const internalSubmission: InternalSubmissionItem[] = frontendRequest.submission.map(item => {
      const realId = SessionUtils.frontendIdToRealId(gameData, item.comment_id);
      if (!realId) {
        throw new BadRequestException(`Failed to map frontend ID: ${item.comment_id}`);
      }

      return {
        comment_id: realId, // Use real database ID
        response_status: item.response_status,
        response_time: item.response_time,
      };
    });

    const apiUrl = this.configService.get<string>('SUBMIT_ANSWERS_API_URL');
    if (!apiUrl) {
      throw new Error('SUBMIT_ANSWERS_API_URL is not configured');
    }

    try {
      // Send internal submission with real IDs to external API
      const requestPayload: GameResultRequest = {
        submission: internalSubmission,
      };

      const response = await lastValueFrom(
        this.httpService.post<GameResultResponse>(apiUrl, requestPayload)
      );

      // Mark all submitted IDs as answered
      frontendRequest.submission.forEach(item => {
        SessionUtils.markAsAnswered(gameData, item.comment_id);
      });

      return response.data;

    } catch (error) {
      throw new Error(`Failed to submit answers: ${error.message}`);
    }
  }

  /**
   * For new feature which import session and redis
   * Submit comment answers using V2 API with enhanced response
   */
  async submitCommentAnswersV2WithSession(
    frontendRequest: FrontendGameResultRequest,
    session: Session & { gameData?: GameSessionData }
  ): Promise<GameResultResponseV2> {
    // Same validation logic as V1
    if (!session.gameData) {
      throw new UnauthorizedException('No active game session found');
    }

    const gameData: GameSessionData = session.gameData;

    // Validate and check duplicates (same as V1)
    for (const item of frontendRequest.submission) {
      if (!SessionUtils.isValidFrontendId(gameData, item.comment_id)) {
        throw new BadRequestException(
          `Invalid comment ID: ${item.comment_id} not found in current session`
        );
      }

      if (SessionUtils.isAlreadyAnswered(gameData, item.comment_id)) {
        throw new BadRequestException(
          `Comment ID: ${item.comment_id} has already been answered`
        );
      }
    }

    // Convert to internal IDs (same as V1)
    const internalSubmission: InternalSubmissionItem[] = frontendRequest.submission.map(item => {
      const realId = SessionUtils.frontendIdToRealId(gameData, item.comment_id);
      if (!realId) {
        throw new BadRequestException(`Failed to map frontend ID: ${item.comment_id}`);
      }

      return {
        comment_id: realId,
        response_status: item.response_status,
        response_time: item.response_time,
      };
    });

    const apiUrl = this.configService.get<string>('SUBMIT_ANSWERS_API_URL_V2');
    if (!apiUrl) {
      throw new Error('SUBMIT_ANSWERS_API_URL_V2 is not configured');
    }

    try {
      const requestPayload: GameResultRequest = {
        submission: internalSubmission,
      };

      const response = await lastValueFrom(
        this.httpService.post<GameResultResponseV2>(apiUrl, requestPayload)
      );

      // Mark as answered (same as V1)
      frontendRequest.submission.forEach(item => {
        SessionUtils.markAsAnswered(gameData, item.comment_id);
      });

      return response.data;

    } catch (error) {
      throw new Error(`Failed to submit answers to V2 API: ${error.message}`);
    }
  }
}