import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.refreshTokenRepo.clear();
      console.log('Cleared all refresh tokens from DB on startup');
    } catch (e) {
      console.error('Failed to clear refresh tokens on startup:', e);
    }
  }

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<any> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash: hashedPassword,
      displayName: dto.displayName,
      username:
        dto.username ||
        dto.email.split('@')[0] + Math.floor(Math.random() * 1000),
    });

    const populatedUser = await this.usersService.findById(user.id);
    return this.generateTokens(populatedUser);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Your account has been banned');
    }

    const match = await bcrypt.compare(pass, user.passwordHash);
    if (match) {
      const { passwordHash: _passwordHash, ...result } = user;

      return result;
    }
    return null;
  }

  async login(user: any) {
    return this.generateTokens(user);
  }

  async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload);

    // Clean up expired or revoked tokens to keep the table size small and queries fast
    try {
      await this.refreshTokenRepo
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now OR revokedAt IS NOT NULL', { now: new Date() })
        .execute();
    } catch (cleanupError) {
      console.error('Failed to clean up old refresh tokens:', cleanupError);
    }

    // Generate Refresh Token
    const refreshTokenStr = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshTokenStr, 10);

    const ttl = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const expiresAt = new Date(Date.now() + ms(ttl as any));

    await this.refreshTokenRepo.save({
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken, // CamelCase to match E2E tests
      refreshToken: refreshTokenStr, // CamelCase to match E2E tests
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshTokenStr: string) {
    const tokens = await this.refreshTokenRepo.find({
      where: { revokedAt: IsNull() },
    });

    let validToken: RefreshToken | null = null;
    for (const token of tokens) {
      if (await bcrypt.compare(refreshTokenStr, token.tokenHash)) {
        validToken = token;
        break;
      }
    }

    if (!validToken || validToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token
    validToken.revokedAt = new Date();
    await this.refreshTokenRepo.save(validToken);

    const user = await this.usersService.findById(validToken.userId);
    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user);
  }

  async logout(refreshTokenStr: string) {
    const tokens = await this.refreshTokenRepo.find({
      where: { revokedAt: IsNull() },
    });

    for (const token of tokens) {
      if (await bcrypt.compare(refreshTokenStr, token.tokenHash)) {
        token.revokedAt = new Date();
        await this.refreshTokenRepo.save(token);
        return { message: 'Logged out successfully' };
      }
    }
    throw new UnauthorizedException('Invalid token');
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message:
          'If your email exists in our system, you will receive a reset link.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this.usersService.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await this.mailService.sendForgotPasswordEmail(user.email, token);

    return {
      message:
        'If your email exists in our system, you will receive a reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetToken(hashedToken);

    if (!user || user.resetPasswordExpires! < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(user.id, {
      passwordHash: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    // Invalidate all refresh tokens
    await this.refreshTokenRepo.update(
      { userId: user.id },
      { revokedAt: new Date() },
    );

    return { message: 'Password reset successfully' };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { passwordHash: _ph, resetPasswordToken: _rpt, resetPasswordExpires: _rpe, ...result } = user;
    return result;
  }
}
