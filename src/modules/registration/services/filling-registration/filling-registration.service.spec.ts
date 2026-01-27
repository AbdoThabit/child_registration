import { Test, TestingModule } from '@nestjs/testing';
import { FillingRegistrationService } from './filling-registration.service';

describe('FillingRegistrationService', () => {
  let service: FillingRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FillingRegistrationService],
    }).compile();

    service = module.get<FillingRegistrationService>(FillingRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
