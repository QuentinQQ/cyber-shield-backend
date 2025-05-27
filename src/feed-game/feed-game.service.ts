import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Session } from 'express-session'; // ADDED: Import Session type
import { 
  RawApiResponse, 
  RawComment, // ADDED: Import RawComment for legacy support
  FrontendComment, 
  FrontendCommentResponse 
} from './interfaces/get-all-comments.interface';
import { 
  GameResultRequest, 
  GameResultResponse, 
  GameResultResponseV2,
  InternalSubmissionItem,
  FrontendGameResultRequest 
} from './interfaces/game-result.interface';
import { GameSessionData } from './interfaces/game-session.interface';
import { SessionUtils } from './utils/session.utils';

@Injectable()
export class FeedGameService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * LEGACY: Original method for backward compatibility
   * Keep existing method signature unchanged
   */
  async getAllComments(): Promise<{ success: boolean; data?: RawComment[]; message: string; statusCode: number; }> {
    const apiUrl = this.configService.get<string>('GET_ALL_COMMENTS_API_URL');
    if (!apiUrl) {
      return {
        success: false,
        message: 'GET_ALL_COMMENTS_API_URL is not configured',
        statusCode: 500,
      };
    }

    try {
      const response = await lastValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl)
      );

      return {
        success: true,
        data: response.data.Comments,
        message: 'Comments retrieved successfully',
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch comments: ${error.message}`,
        statusCode: 500,
      };
    }
  }

  /**
   * NEW: Session-based method with ID mapping and obfuscation
   * Fetch comments from external API and set up session mapping
   */
  async getCommentsWithSession(session: Session & { gameData?: GameSessionData }): Promise<FrontendCommentResponse> {
    // NEW: Initialize or get existing game session data
    if (!session.gameData) {
      session.gameData = SessionUtils.initializeGameSession();
    }

    const apiUrl = this.configService.get<string>('GET_ALL_COMMENTS_API_URL');
    if (!apiUrl) {
      throw new Error('GET_ALL_COMMENTS_API_URL is not configured');
    }

    try {
      // UNCHANGED: Fetch data from external API
      const response = await lastValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl)
      );

      const rawComments = response.data.Comments;
      
      // NEW: Generate frontend IDs and create mappings
      const frontendComments: FrontendComment[] = rawComments.map(comment => {
        const frontendId = SessionUtils.generateFrontendId();
        const realId = comment.comment_id;

        // NEW: Store bidirectional mapping in session
        session.gameData!.commentIdMap[frontendId] = realId;
        session.gameData!.reverseCommentIdMap[realId] = frontendId;
        session.gameData!.activeSessionCommentIds.push(frontendId);

        return {
          comment_id: frontendId, // CHANGED: Use obfuscated ID
          comment_text: comment.comment_text,
          comment_fake_name: comment.comment_fake_name,
        };
      });

      // NEW: Update session metadata
      session.gameData.questionsShown = frontendComments.length;

      // NEW: Return structured response with session info
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
   * Submit comment answers with session validation and ID mapping
   * MODIFIED: Now validates session state and converts frontend IDs to real IDs
   */
  async submitCommentAnswers(
    frontendRequest: FrontendGameResultRequest,
    session: Session & { gameData?: GameSessionData }
  ): Promise<GameResultResponse> {
    // NEW: Validate session exists and has game data
    if (!session.gameData) {
      throw new UnauthorizedException('No active game session found');
    }

    const gameData: GameSessionData = session.gameData;
    
    // NEW: Validate all frontend IDs are in current session scope
    for (const item of frontendRequest.submission) {
      if (!SessionUtils.isValidFrontendId(gameData, item.comment_id)) {
        throw new BadRequestException(
          `Invalid comment ID: ${item.comment_id} not found in current session`
        );
      }

      // NEW: Check for duplicate submissions
      if (SessionUtils.isAlreadyAnswered(gameData, item.comment_id)) {
        throw new BadRequestException(
          `Comment ID: ${item.comment_id} has already been answered`
        );
      }
    }

    // NEW: Convert frontend IDs to real database IDs
    const internalSubmission: InternalSubmissionItem[] = frontendRequest.submission.map(item => {
      const realId = SessionUtils.frontendIdToRealId(gameData, item.comment_id);
      if (!realId) {
        throw new BadRequestException(`Failed to map frontend ID: ${item.comment_id}`);
      }

      return {
        comment_id: realId, // CHANGED: Use real database ID
        response_status: item.response_status,
        response_time: item.response_time,
      };
    });

    const apiUrl = this.configService.get<string>('SUBMIT_ANSWERS_API_URL');
    if (!apiUrl) {
      throw new Error('SUBMIT_ANSWERS_API_URL is not configured');
    }

    try {
      // MODIFIED: Send internal submission with real IDs to external API
      const requestPayload: GameResultRequest = {
        submission: internalSubmission,
      };

      const response = await lastValueFrom(
        this.httpService.post<GameResultResponse>(apiUrl, requestPayload)
      );

      // NEW: Mark all submitted IDs as answered
      frontendRequest.submission.forEach(item => {
        SessionUtils.markAsAnswered(gameData, item.comment_id);
      });

      return response.data;

    } catch (error) {
      throw new Error(`Failed to submit answers: ${error.message}`);
    }
  }

  /**
   * Submit comment answers using V2 API with enhanced response
   * MODIFIED: Same session validation and ID mapping as V1
   */
  async submitCommentAnswersV2(
    frontendRequest: FrontendGameResultRequest,
    session: Session & { gameData?: GameSessionData }
  ): Promise<GameResultResponseV2> {
    // NEW: Same validation logic as V1
    if (!session.gameData) {
      throw new UnauthorizedException('No active game session found');
    }

    const gameData: GameSessionData = session.gameData;

    // NEW: Validate and check duplicates (same as V1)
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

    // NEW: Convert to internal IDs (same as V1)
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

      // NEW: Mark as answered (same as V1)
      frontendRequest.submission.forEach(item => {
        SessionUtils.markAsAnswered(gameData, item.comment_id);
      });

      return response.data;

    } catch (error) {
      throw new Error(`Failed to submit answers to V2 API: ${error.message}`);
    }
  }
}