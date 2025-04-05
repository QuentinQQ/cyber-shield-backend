import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedGameDto } from './create-feed-game.dto';

export class UpdateFeedGameDto extends PartialType(CreateFeedGameDto) {}
