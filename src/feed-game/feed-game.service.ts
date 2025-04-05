import { Injectable } from '@nestjs/common';
import { CreateFeedGameDto } from './dto/create-feed-game.dto';
import { UpdateFeedGameDto } from './dto/update-feed-game.dto';

@Injectable()
export class FeedGameService {
  create(createFeedGameDto: CreateFeedGameDto) {
    return 'This action adds a new feedGame';
  }

  findAll() {
    return `This action returns all feedGame`;
  }

  findOne(id: number) {
    return `This action returns a #${id} feedGame`;
  }

  update(id: number, updateFeedGameDto: UpdateFeedGameDto) {
    return `This action updates a #${id} feedGame`;
  }

  remove(id: number) {
    return `This action removes a #${id} feedGame`;
  }
}
