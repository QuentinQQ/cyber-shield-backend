import { Test, TestingModule } from '@nestjs/testing';
import { FeedGameController } from './feed-game.controller';
import { FeedGameService } from './feed-game.service';

describe('FeedGameController', () => {
  let controller: FeedGameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedGameController],
      providers: [FeedGameService],
    }).compile();

    controller = module.get<FeedGameController>(FeedGameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
