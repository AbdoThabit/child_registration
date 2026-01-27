import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationController } from './registration.controller';
import { AdminRegistrationService } from './services/generate-registration.service';

describe('RegistrationController', () => {
  let controller: RegistrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [AdminRegistrationService],
    }).compile();

    controller = module.get<RegistrationController>(RegistrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
