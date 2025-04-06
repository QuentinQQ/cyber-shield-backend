import { Module } from '@nestjs/common';
import { FeedGameService } from './feed-game.service';
import { FeedGameController } from './feed-game.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [FeedGameController],
  providers: [FeedGameService],
})
export class FeedGameModule {}
