import { Module } from '@nestjs/common';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';
import { ParentUsers } from 'src/database/isecure/entities/entities/ParentUsers';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from 'src/database/icare/entities/entities/Parent';

@Module({
  imports : [
    TypeOrmModule.forFeature([ParentUsers], 'isecure'),
        TypeOrmModule.forFeature([Parent,CareCenter], 'icare'), 
  ],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
