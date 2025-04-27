import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TextCheckerController } from './text-checker.controller';
import { TextCheckerService } from './text-checker.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [TextCheckerController],
  providers: [TextCheckerService],
})
export class TextCheckerModule {}
