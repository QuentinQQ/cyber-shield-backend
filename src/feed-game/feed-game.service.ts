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
}
