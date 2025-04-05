import { Injectable, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface RawComment {
  comment_id: number;
  comment_text: string;
  comment_fake_name: string;
}

interface RawApiResponse {
  Comments: RawComment[];
}

@Injectable()
export class FeedGameService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get all comments using axios (no DTOs, just interface).
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

      const response = await axios.get<RawApiResponse>(apiUrl);

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
      return {
        success: false,
        message: err.message,
        statusCode: err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
