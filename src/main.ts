import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino/Logger';
import cookieParser from 'cookie-parser' 
import { AppValidationPipe } from './common/pipes/validation.pipe';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 5555;
  app.useLogger(app.get(Logger))
  app.use(cookieParser());
  app.useGlobalPipes(AppValidationPipe)
  await app.listen(process.env.PORT ?? 5555);
  
  const logger = app.get(Logger);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
