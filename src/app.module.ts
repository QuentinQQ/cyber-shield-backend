import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeedGameModule } from './feed-game/feed-game.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [FeedGameModule, QuizModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
