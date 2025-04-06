import { Test, TestingModule } from '@nestjs/testing';
import { FeedGameService } from './feed-game.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('FeedGameService', () => {
  let service: FeedGameService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedGameService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn().mockReturnValue(
              of({
                data: {
                  score: 1,
                  answered: 2,
                  answered_cor: 1,
                  percent: '50%',
                  submission_id: 123,
                  comparison: '76%',
                },
              }),
            ),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://mock-api'),
          },
        },
      ],
    }).compile();

    service = module.get<FeedGameService>(FeedGameService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should submit comment answers successfully', async () => {
    const result = await service.submitCommentAnswers([
      { comment_id: 1, response_status: 'like', response_time: 2000 },
    ]);
    expect(result.score).toBe(1);
    expect(result.percent).toBe('50%');
  });
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { FeedGameService } from './feed-game.service';

// describe('FeedGameService', () => {
//   let service: FeedGameService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [FeedGameService],
//     }).compile();

//     service = module.get<FeedGameService>(FeedGameService);
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
// });
