import { Module } from '@nestjs/common';
import { FeedGameModule } from './feed-game/feed-game.module';
import { QuizModule } from './quiz/quiz.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    FeedGameModule,
    QuizModule,
  ],
})
export class AppModule {}
