import { Module } from '@nestjs/common';
import { AdminRegistrationService } from './services/generate-registration.service';
import { RegistrationController } from './registration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { ParentRegistrationLink } from 'src/database/icare/entities/entities/ParentRegistrationLinks';
import { ChildRegistration } from 'src/database/icare/entities/entities/ChildRegistration';
import { Class } from 'src/database/icare/entities/entities/Class';
import { Parent } from 'src/database/icare/entities/entities/Parent';
import { ParentRegistrationService } from './services/filling-registration/filling-registration.service';
import { FileSystemModule } from '../file-system/file-system.module';
import { Child } from 'src/database/icare/entities/entities/Child';
import { ClassChild } from 'src/database/icare/entities/entities/ClassChild';
import { vwClass } from 'src/database/icare/entities/views/vhClasses';

@Module({
  imports : [
          TypeOrmModule.forFeature([ParentRegistrationLink,CareCenter,ChildRegistration,Class,Parent,Child,ClassChild,vwClass], 'icare'), 
          FileSystemModule
    ],
  controllers: [RegistrationController],
  providers: [AdminRegistrationService, ParentRegistrationService],
})
export class RegistrationModule {}
