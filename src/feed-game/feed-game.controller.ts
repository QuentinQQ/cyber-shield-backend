import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedGameService } from './feed-game.service';
import { CreateFeedGameDto } from './dto/create-feed-game.dto';
import { UpdateFeedGameDto } from './dto/update-feed-game.dto';

@Controller('feed-game')
export class FeedGameController {
  constructor(private readonly feedGameService: FeedGameService) {}

  @Post()
  create(@Body() createFeedGameDto: CreateFeedGameDto) {
    return this.feedGameService.create(createFeedGameDto);
  }

  @Get()
  findAll() {
    return this.feedGameService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedGameService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeedGameDto: UpdateFeedGameDto) {
    return this.feedGameService.update(+id, updateFeedGameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedGameService.remove(+id);
  }
}
