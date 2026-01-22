import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type { Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ResponseMessage('User registered successfully.')
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: SignUpDto) {
    return this.authService.register(createUserDto);
  }

  @ResponseMessage('User logged in successfully.')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const tokenResponse = await this.authService.login(loginDto);

    response.cookie('refresh_token', tokenResponse.refreshToken, {
      httpOnly: true,
      // Only accept https in production
      // secure: process.env.NODE_ENV === 'production',
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return tokenResponse;
  }


  @ResponseMessage('User profile retrieved successfully.')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: any) {
    return req.user;
  }


  @ResponseMessage('Tokens refreshed successfully.')
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) response: Response) {
    // when use typeOrm 
    const refreshToken = req.user.refreshToken;
    const tokenResponse = await this.authService.refreshTokens(refreshToken);

    // Rotate Cookie
    response.cookie('refresh_token', tokenResponse.refreshToken, {
      httpOnly: true,
      // Only accept https in production

      // secure: process.env.NODE_ENV === 'production',
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return tokenResponse;


    // >>when using auth.service option 1 (stored procedures)

    // const userId = req.user.sub;
    // return await this.authService.refreshTokens(userId, refreshToken);

  }


  @ResponseMessage('User logged out successfully.')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(req.user.sub);
    // Clear Cookie
    response.clearCookie('refresh_token')
  }


}