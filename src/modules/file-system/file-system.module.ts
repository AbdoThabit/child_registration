import { Module } from '@nestjs/common';
import { ImageService } from './services/images/image.service';
import multer from 'multer';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MulterModule],
  providers: [ImageService],
  exports: [ImageService],
})
export class FileSystemModule {}
