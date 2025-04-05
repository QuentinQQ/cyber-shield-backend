import { Module } from '@nestjs/common';
import { FeedGameModule } from './feed-game/feed-game.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [FeedGameModule, QuizModule],
})
export class AppModule {}
