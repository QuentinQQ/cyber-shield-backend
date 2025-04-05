import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeedGameModule } from './feed-game/feed-game.module';

@Module({
  imports: [FeedGameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
