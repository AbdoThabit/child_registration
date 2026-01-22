import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (requst: Request) => {
          // Check Cookie
          return requst?.cookies?.['refresh_token'];
          // Check Header
        }, ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    let refreshToken = req.cookies?.['refresh_token'];

    if (!refreshToken) {
      const authHeader = req.get('Authorization');
      refreshToken = authHeader?.replace('Bearer', '').trim();
    }

    if (!refreshToken) throw new UnauthorizedException('Refresh Token Missing');

    return { ...payload, refreshToken };
  }
}