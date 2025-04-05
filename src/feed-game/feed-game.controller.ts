import { Controller, Get } from '@nestjs/common';
import { FeedGameService } from './feed-game.service';
import { RawComment } from './feed-game.service';

type CommentApiResult = {
  success: boolean;
  data?: RawComment[];
  message: string;
  statusCode: number;
};

@Controller('feed-game')
export class FeedGameController {
  constructor(private readonly feedGameService: FeedGameService) {}

  /**
   * Get all comments from the API.
   */
  @Get('get-all-comments')
  async getAllComments(): Promise<CommentApiResult> {
    return this.feedGameService.getAllComments();
  }
}
