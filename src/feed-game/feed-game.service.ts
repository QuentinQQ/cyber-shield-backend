import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  GameResultRequest,
  GameResultResponse,
  GameResultResponseV2,
} from './interfaces/game-result.interface';
import {
  RawApiResponse,
  RawComment,
} from './interfaces/get-all-comments.interface';

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
   * @description Submit player's answers to remote API and return result.
   * @param submission - An array of submitted answers from the player.
   * @returns Remote game result including score, percent correct, and comparison.
   * @throws Error if remote API call fails.
   */
  async submitCommentAnswers(
    submission: GameResultRequest['submission'],
  ): Promise<GameResultResponse> {
    const url = this.configService.get<string>('SUBMIT_ANSWERS_API_URL');
    if (!url) {
      throw new Error(
        'Missing SUBMIT_ANSWERS_API_URL in environment variables',
      );
    }
    const body: GameResultRequest = { submission };

    try {
      const response = await firstValueFrom(
        this.httpService.post<GameResultResponse>(url, body).pipe(
          timeout(10000),
          catchError((error) => {
            this.logger.error(
              'Remote API request failed',
              error?.message || error,
            );
            return throwError(() => new Error('Remote API request failed'));
          }),
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('submitCommentAnswers failed', error?.message || error);
      throw new Error('Failed to submit comment answers');
    }
  }

  /**
   * @description Submit player's answers to V2 remote API with enhanced feedback.
   * @param submission - An array of submitted answers from the player.
   * @returns Enhanced remote game result including mistakes, problem areas, and summary.
   * @throws Error if remote API call fails.
   */
  async submitCommentAnswersV2(
    submission: GameResultRequest['submission'],
  ): Promise<GameResultResponseV2> {
    const url = this.configService.get<string>('SUBMIT_ANSWERS_API_URL_V2');

    if (!url) {
      throw new Error(
        'Missing SUBMIT_ANSWERS_API_URL_V2 in environment variables',
      );
    }

    const body: GameResultRequest = { submission };

    try {
      const response = await firstValueFrom(
        this.httpService.post<GameResultResponseV2>(url, body).pipe(
          timeout(10000),
          catchError((error) => {
            this.logger.error(
              'Submit Answer V2 request failed',
              error?.message || error,
            );
            return throwError(
              () => new Error('Submit Answer V2 request failed'),
            );
          }),
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'submitCommentAnswersV2 failed',
        error?.message || error,
      );
      throw new HttpException(
        'Failed to submit comment answers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
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
        return {
          success: false,
          message: 'API URL not configured',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      const response = await firstValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl),
      );

      if (!response.data || !Array.isArray(response.data.Comments)) {
        return {
          success: false,
          message: 'Invalid response format',
          statusCode: HttpStatus.BAD_GATEWAY,
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
      this.logger.error('Failed to fetch comments', err.message);
      return {
        success: false,
        message: err.message,
        statusCode: err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
   * @description Fetch all raw comments from remote API configured in environment.
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
        return {
          success: false,
          message: 'API URL not configured',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
      }

      const response = await firstValueFrom(
        this.httpService.get<RawApiResponse>(apiUrl),
      );

      if (!response.data || !Array.isArray(response.data.Comments)) {
        return {
          success: false,
          message: 'Invalid response format',
          statusCode: HttpStatus.BAD_GATEWAY,
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
      this.logger.error('Failed to fetch comments', err.message);
      return {
        success: false,
        message: err.message,
        statusCode: err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
