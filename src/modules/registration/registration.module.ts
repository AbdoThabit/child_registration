import { Module } from '@nestjs/common';
import { GeneratingRegistrationService } from './services/generate-registration.service';
import { RegistrationController } from './registration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { ParentRegistrationLink } from 'src/database/icare/entities/entities/ParentRegistrationLinks';
import { ChildRegistration } from 'src/database/icare/entities/entities/ChildRegistration';
import { Class } from 'src/database/icare/entities/entities/Class';
import { Parent } from 'src/database/icare/entities/entities/Parent';
import { FillingRegistrationService } from './services/filling-registration/filling-registration.service';
import { FileSystemModule } from '../file-system/file-system.module';

@Module({
  imports : [
          TypeOrmModule.forFeature([ParentRegistrationLink,CareCenter,ChildRegistration,Class,Parent], 'icare'), 
          FileSystemModule
    ],
  controllers: [RegistrationController],
  providers: [GeneratingRegistrationService, FillingRegistrationService],
})
export class RegistrationModule {}
