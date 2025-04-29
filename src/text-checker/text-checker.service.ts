import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TextCheckerAnalyzeRequestDto } from './dto/text-checker-analyze-request.dto';
import { TextCheckerAnalyzeResponseDto } from './dto/text-checker-analyze-response.dto';

// Define an interface for the external API response
interface TextCheckerApiResponse {
  text: string;
  is_bullying: string; // API returns "True" or "False" as strings
  toxicity_score: string;
  sentiment_score: string;
  suggested_text: string;
  person_or_pronoun: string;
  cyberbullying_flag: string;
}

/**
 * @description Service responsible for communicating with the text analysis API.
 */
@Injectable()
export class TextCheckerService {
  private readonly logger = new Logger(TextCheckerService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * @description Analyzes text for bullying content using external API
   * @param requestDto - The text to be analyzed
   * @returns Analysis result with bullying detection and suggested alternative if applicable
   * @throws Error if remote API call fails
   */
  async analyze(
    requestDto: TextCheckerAnalyzeRequestDto,
  ): Promise<TextCheckerAnalyzeResponseDto> {
    const url = this.configService.get<string>('TEXT_CHECKER_API_URL');
    const token = this.configService.get<string>('TEXT_CHECKER_API_TOKEN');

    // Validate environment variables
    if (!url) {
      throw new Error('Missing TEXT_CHECKER_API_URL in environment variables');
    }

    // Validate environment variables
    if (!token) {
      throw new Error(
        'Missing TEXT_CHECKER_API_TOKEN in environment variables',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<TextCheckerApiResponse>(
            url,
            { text: requestDto.text },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .pipe(
            timeout(30000), // set 30 second timeout, this api needs a long time to process
            catchError((error) => {
              this.logger.error(
                'Text analysis API request failed',
                error?.message || error,
              );
              return throwError(
                () => new Error('Text analysis API request failed'),
              );
            }),
          ),
      );

      // Log the full response for debugging purposes
      this.logger.debug('Text analysis API response', response.data);

      // Create a properly typed response object
      const result: TextCheckerAnalyzeResponseDto = {
        is_bullying: response.data.is_bullying === 'True',
        suggested_text: response.data.suggested_text || undefined,
      };

      return result;
    } catch (error) {
      this.logger.error('Text analysis failed', error?.message || error);
      throw new Error('Failed to analyze text');
    }
  }
}
