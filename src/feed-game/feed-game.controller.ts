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

@ApiTags('api/feed-game')
@Controller('api/feed-game')
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
      message: `You answered ${result.percent} of the questions correctly.`,
      score: result.score,
      answered: result.answered,
      answered_correct: result.answered_cor,
      comparison: result.comparison,
      submission_id: result.submission_id,
    };
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
}

// import { Controller, Get } from '@nestjs/common';
// import { FeedGameService } from './feed-game.service';
// import { RawComment } from './feed-game.service';

// type CommentApiResult = {
//   success: boolean;
//   data?: RawComment[];
//   message: string;
//   statusCode: number;
// };

// @Controller('feed-game')
// export class FeedGameController {
//   constructor(private readonly feedGameService: FeedGameService) {}

//   /**
//    * Get all comments from the API.
//    */
//   @Get('get-all-comments')
//   async getAllComments(): Promise<CommentApiResult> {
//     return this.feedGameService.getAllComments();
//   }
// }
