import { Test, TestingModule } from '@nestjs/testing';
import { GeneratingRegistrationService } from './generate-registration.service';

describe('RegistrationService', () => {
  let service: GeneratingRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneratingRegistrationService],
    }).compile();

    service = module.get<GeneratingRegistrationService>(GeneratingRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
