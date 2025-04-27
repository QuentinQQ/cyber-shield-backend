import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { FeedGameModule } from './feed-game/feed-game.module';
import { QuizModule } from './quiz/quiz.module';
import { TextCheckerModule } from './text-checker/text-checker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 180 }]), // rate limit for 1 minute 180 requests
    FeedGameModule,
    QuizModule,
    TextCheckerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // enable global throttle guard
    },
  ],
})
export class AppModule {}
