import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Public, GetCurrentUserId, GetCurrentUser } from '../common/decorators';
import { RtGuard } from '../common/guards';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Public()
  // @Post('local/signup')
  // @HttpCode(HttpStatus.CREATED)
  // signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
  //   return this.authService.signupLocal(dto);
  // }

  // @Public()
  // @Post('local/signin')
  // @HttpCode(HttpStatus.OK)
  // signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
  //   return this.authService.signinLocal(dto);
  // }

  @Public()
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  async signupLocal(@Body() dto: AuthDto): Promise<void> {
    return this.authService.signupLocal(dto);
  }

  @Public()
  @Post('local/verify-signup-otp')
  @HttpCode(HttpStatus.OK)
  async verifySignupOtp(
    @Body() dto: { email: string; otp: string },
  ): Promise<Tokens> {
    return this.authService.verifySignupOtp(dto);
  }

  @Public()
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  async signinLocal(@Body() dto: AuthDto): Promise<void> {
    return this.authService.signinLocal(dto);
  }

  @Public()
  @Post('local/verify-signin-otp')
  @HttpCode(HttpStatus.OK)
  async verifySigninOtp(
    @Body() dto: { email: string; otp: string },
  ): Promise<Tokens> {
    return this.authService.verifySigninOtp(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
