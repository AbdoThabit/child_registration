import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CenterUsers } from 'src/database/isecure/entities/entities/CenterUsers';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { SecUsers } from 'src/database/icare/entities/entities/SecUsers';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';

@Module({
  imports: [
    TypeOrmModule.forFeature([CenterUsers], 'isecure'),
    TypeOrmModule.forFeature([SecUsers,CareCenter], 'icare'), 
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
