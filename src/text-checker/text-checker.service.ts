import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TextCheckerAnalyzeRequestDto } from './dto/text-checker-analyze-request.dto';
import { TextCheckerAnalyzeResponseDto } from './dto/text-checker-analyze-response.dto';
import { TextCheckerAnalyzeResponseV2Dto } from './dto/text-checker-analyze-response-v2.dto';

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

// Define an interface for the updated external API response
interface TextCheckerApiResponseV2 {
  zone: string;
  likelihood: string;
  comment: string;
  suggested_text: string;
}

/**
 * @description Service responsible for communicating with the text analysis API.
 */
@Injectable()
export class TextCheckerService {
  private readonly logger = new Logger(TextCheckerService.name);

  private readonly maliciousPatterns = [
    /<script.*?>|javascript:|on\w+\s*=|eval\(|setTimeout|fetch\(|ajax\(|\.post\(|document\.cookie/i,
    /\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|%[0-9a-f]{2}/i, // Coded Character Detection
    /\[\s*\]\s*\[\s*\]|\{\s*\}\s*\.\s*constructor/i, // JS Prototype contamination attempts
  ];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Maps a zone string to a numeric bullying level
   * @param zone - The zone string (Green/Yellow/Orange/Red)
   * @returns Numeric bullying level (1-4)
   */
  private mapZoneToBullyingLevel(zone: string): number {
    const zoneLower = zone.toLowerCase();

    if (zoneLower.includes('green')) return 1;
    if (zoneLower.includes('yellow')) return 2;
    if (zoneLower.includes('orange')) return 3;
    if (zoneLower.includes('red')) return 4;

    // Default to lowest level if no match is found
    this.logger.warn(`Unknown zone value encountered: ${zone}`);
    return 1;
  }

  /**
   * @description Analyzes text for bullying content using external API
   * @param requestDto - The text to be analyzed
   * @returns Analysis result with bullying detection and suggested alternative if applicable
   * @throws Error if remote API call fails
   */
  async analyze(
    requestDto: TextCheckerAnalyzeRequestDto,
  ): Promise<TextCheckerAnalyzeResponseDto> {
    const textToAnalyze = requestDto.text.trim();

    // Check for malicious patterns in the input text
    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(textToAnalyze)) {
        this.logger.warn(
          `Potential malicious content detected in text input: "${textToAnalyze.substring(0, 50)}..."`,
        );
        throw new BadRequestException(
          'Input contains potentially harmful content',
        );
      }
    }

    const url = this.configService.get<string>('TEXT_CHECKER_API_URL');
    const token = this.configService.get<string>('TEXT_CHECKER_API_TOKEN');

    if (!url || !token) {
      this.logger.error('Missing required API configuration');
      throw new Error('Internal server error. Please contact support.');
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<TextCheckerApiResponse>(
            url,
            { text: textToAnalyze },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .pipe(
            timeout(30000), // set 30 second timeout, this api needs a long time to process
            catchError((error: unknown) => {
              this.logger.error(
                'Text analysis API request failed',
                error instanceof Error ? error.message : String(error),
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
    } catch (error: unknown) {
      this.logger.error(
        'Text analysis failed',
        error instanceof Error ? error.message : String(error),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Failed to analyze text. Please try again later.');
    }
  }

  /**
   * @description Analyzes text using the updated external API format
   * @param requestDto - The text to be analyzed
   * @returns Analysis result with zone classification, likelihood, comment and suggested text
   * @throws Error if remote API call fails
   */
  async analyzeV2(
    requestDto: TextCheckerAnalyzeRequestDto,
  ): Promise<TextCheckerAnalyzeResponseV2Dto> {
    const textToAnalyze = requestDto.text.trim();

    // Check for malicious patterns in the input text
    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(textToAnalyze)) {
        this.logger.warn(
          `Potential malicious content detected in text input: "${textToAnalyze.substring(0, 50)}..."`,
        );
        throw new BadRequestException(
          'Input contains potentially harmful content',
        );
      }
    }

    const url = this.configService.get<string>('TEXT_CHECKER_API_URL');
    const token = this.configService.get<string>('TEXT_CHECKER_API_TOKEN');

    if (!url || !token) {
      this.logger.error('Missing required API V2 configuration');
      throw new Error('Internal server error. Please contact support.');
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<TextCheckerApiResponseV2>(
            url,
            { text: textToAnalyze },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .pipe(
            timeout(30000), // set 30 second timeout, this api needs a long time to process
            catchError((error: unknown) => {
              this.logger.error(
                'Text analysis V2 API request failed',
                error instanceof Error ? error.message : String(error),
              );
              return throwError(
                () => new Error('Text analysis V2 API request failed'),
              );
            }),
          ),
      );

      // Log the full response for debugging purposes
      this.logger.debug('Text analysis V2 API response', response.data);

      // Create a properly typed response object and map zone to bullying_level
      const result: TextCheckerAnalyzeResponseV2Dto = {
        zone: response.data.zone,
        likelihood: response.data.likelihood,
        comment: response.data.comment,
        suggested_text: response.data.suggested_text,
        bullying_level: this.mapZoneToBullyingLevel(response.data.zone),
      };

      return result;
    } catch (error: unknown) {
      this.logger.error(
        'Text analysis V2 failed',
        error instanceof Error ? error.message : String(error),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Failed to analyze text. Please try again later.');
    }
  }
}
