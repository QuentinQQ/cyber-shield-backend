import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FeedGameService } from './feed-game.service';
import { SubmitResultsDto } from './dto/submit-results.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GameResultResponseV2 } from './interfaces/game-result.interface';

@ApiTags('api/feed-game')
@Controller('api/feed-game')
@Throttle({ default: { ttl: 60000, limit: 60 } }) // rate limit for 1 minute 60 requests
export class FeedGameController {
  constructor(private readonly feedGameService: FeedGameService) {}

  /**
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
  async submitResults(@Body() body: SubmitResultsDto): Promise<any> {
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
   * @description Fetches a list of comments used in the game (existing logic).
   * @returns A list of game feed comments.
   */
  @Get('get-all-comments-v2')
  @ApiOperation({ summary: 'Get all game comments' })
  @ApiResponse({ status: 200, description: 'List of comments returned' })
  async getCommentsV2() {
    return this.feedGameService.getAllCommentsV2();
  }
}
