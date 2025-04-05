import { Module } from '@nestjs/common';
import { FeedGameService } from './feed-game.service';
import { FeedGameController } from './feed-game.controller';

@Module({
  controllers: [FeedGameController],
  providers: [FeedGameService],
})
export class FeedGameModule {}
