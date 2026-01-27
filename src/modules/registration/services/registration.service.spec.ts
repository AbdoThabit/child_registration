import { Test, TestingModule } from '@nestjs/testing';
import { AdminRegistrationService } from './generate-registration.service';

describe('RegistrationService', () => {
  let service: AdminRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRegistrationService],
    }).compile();

    service = module.get<AdminRegistrationService>(AdminRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
