import { Test, TestingModule } from '@nestjs/testing';
import { FeedGameService } from './feed-game.service';

describe('FeedGameService', () => {
  let service: FeedGameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedGameService],
    }).compile();

    service = module.get<FeedGameService>(FeedGameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
