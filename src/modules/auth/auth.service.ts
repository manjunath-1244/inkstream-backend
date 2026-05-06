import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User, UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      username: dto.email.split('@')[0] + Math.floor(Math.random() * 1000), // Default username
    });

    return this.generateTokens(user);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Your account has been banned');
    }

    const match = await bcrypt.compare(pass, user.passwordHash);
    if (match) {
      const { passwordHash, ...result } = user;
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
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshTokenStr: string) {
    const tokens = await this.refreshTokenRepo.find({
      where: { revokedAt: undefined },
    });

    // We have to verify the hash manually or find by user then verify
    // For simplicity in this assignment, we'll find by the string (this is not ideal but works for demonstration)
    // Actually, let's do it better: find all active tokens and compare
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
      where: { revokedAt: undefined },
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
      // Don't leak user existence for security
      return { message: 'If your email exists in our system, you will receive a reset link.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this.usersService.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    console.log(`[AUTH] Reset Password Link: http://localhost:3001/auth/reset-password?token=${token}`);
    
    return { message: 'If your email exists in our system, you will receive a reset link.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // We need a way to find user by reset token. Adding to UsersService.
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
    await this.refreshTokenRepo.update({ userId: user.id }, { revokedAt: new Date() });

    return { message: 'Password reset successfully' };
  }

  
}