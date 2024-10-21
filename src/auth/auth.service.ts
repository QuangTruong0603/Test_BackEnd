import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

import { AuthDto } from './dto';
import { JwtPayload, Tokens } from './types';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // async signupLocal(dto: AuthDto): Promise<Tokens> {
  //   const hash = await argon.hash(dto.password);

  //   const user = await this.prisma.user
  //     .create({
  //       data: {
  //         email: dto.email,
  //         hash,
  //       },
  //     })
  //     .catch((error) => {
  //       if (error) {
  //         if (error.code === 'P2002') {
  //           throw new ForbiddenException('Credentials incorrect');
  //         }
  //       }
  //       throw error;
  //     });

  //   const tokens = await this.getTokens(user.id, user.email);
  //   await this.updateRtHash(user.id, tokens.refresh_token);

  //   return tokens;
  // }
  async signupLocal(dto: AuthDto): Promise<void> {
    const hash = await argon.hash(dto.password);

    const user = await this.prisma.user
      .create({
        data: {
          email: dto.email,
          hash,
          isActive: false, // Đánh dấu tài khoản chưa được kích hoạt
        },
      })
      .catch((error) => {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already in use');
        }
        throw error;
      });

    const otpCode = randomInt(100000, 999999).toString();
    const otpExpiration = new Date();
    otpExpiration.setSeconds(otpExpiration.getSeconds() + 60);// Hết hạn sau 60 giây

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otpCode,
        otpExpiration,
      },
    });

    await this.emailService.sendEmail(dto.email, 'OTP Verification', `Your OTP code is: ${otpCode}`);
  }

  async verifySignupOtp(dto: { email: string; otp: string }): Promise<Tokens> {
    if (!dto.email) {
      throw new ForbiddenException('Email is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('User not found');

    // Kiểm tra mã OTP và thời gian hết hạn
    const currentTime = new Date();
    if (user.otp !== dto.otp || user.otpExpiration < currentTime) {
      throw new ForbiddenException('Invalid or expired OTP');
    }

    // Kích hoạt tài khoản và xóa mã OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        otp: null,
        otpExpiration: null,
      },
    });

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }


  // async signinLocal(dto: AuthDto): Promise<Tokens> {
  //   this.emailService.sendEmail("fortnight01213587@gmail.com", 'bac', 'abc');
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email: dto.email,
  //     },
  //   });

  //   if (!user) throw new ForbiddenException('Access Denied');

  //   const passwordMatches = await argon.verify(user.hash, dto.password);
  //   if (!passwordMatches) throw new ForbiddenException('Access Denied');

  //   const tokens = await this.getTokens(user.id, user.email);
  //   await this.updateRtHash(user.id, tokens.refresh_token);

  //   return tokens;
  // }

  async signinLocal(dto: AuthDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await argon.verify(user.hash, dto.password);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    if (!user.isActive) throw new ForbiddenException('Account not activated');

    // Tạo mã OTP cho đăng nhập
    const otpCode = randomInt(100000, 999999).toString();
    const otpExpiration = new Date();
    otpExpiration.setSeconds(otpExpiration.getSeconds() + 60); 

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otpCode,
        otpExpiration,
      },
    });

    await this.emailService.sendEmail(dto.email, 'OTP for Login', `Your OTP code is: ${otpCode}`);
  }

  async verifySigninOtp(dto: { email: string; otp: string }): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('User not found');

    const currentTime = new Date();
    if (user.otp !== dto.otp || user.otpExpiration < currentTime) {
      throw new ForbiddenException('Invalid or expired OTP');
    }

    // Xóa mã OTP sau khi xác thực
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiration: null,
      },
    });

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: number): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    return true;
  }

  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await argon.hash(rt);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('AT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
