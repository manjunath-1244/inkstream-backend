import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { resetPasswordToken: token } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async updateRole(id: string, role: Role): Promise<User | null> {
    await this.userRepository.update(id, { role });
    return this.findById(id);
  }

  async follow(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const user = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['following'] 
    });
    const target = await this.userRepository.findOne({ 
      where: { id: targetId }, 
      relations: ['blockedUsers'] 
    });

    if (!user || !target) throw new NotFoundException('User not found');

    // Check if target has blocked the user
    const isBlocked = target.blockedUsers.some(u => u.id === userId);
    if (isBlocked) {
      throw new ForbiddenException('You are blocked by this user');
    }

    if (!user.following.some(u => u.id === targetId)) {
      user.following.push(target);
      await this.userRepository.save(user);
    }
  }

  async unfollow(userId: string, targetId: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['following'] 
    });
    if (!user) throw new NotFoundException('User not found');

    user.following = user.following.filter(u => u.id !== targetId);
    await this.userRepository.save(user);
  }

  async block(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const user = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['blockedUsers', 'following', 'followers'] 
    });
    const target = await this.userRepository.findOne({ 
      where: { id: targetId },
      relations: ['following']
    });

    if (!user || !target) throw new NotFoundException('User not found');

    // 1. Add to blocked list
    if (!user.blockedUsers.some(u => u.id === targetId)) {
      user.blockedUsers.push(target);
    }

    // 2. Unfollow the target
    user.following = user.following.filter(u => u.id !== targetId);

    // 3. Force target to unfollow the current user (reciprocal)
    target.following = target.following.filter(u => u.id !== userId);

    await this.userRepository.save([user, target]);
  }

  async unblock(userId: string, targetId: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['blockedUsers'] 
    });
    if (!user) throw new NotFoundException('User not found');

    user.blockedUsers = user.blockedUsers.filter(u => u.id !== targetId);
    await this.userRepository.save(user);
  }

  async isFollowing(userId: string, targetId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    if (!user) throw new NotFoundException('User not found');

    const following = user.following.some(u => u.id === targetId);
    return { following };
  }

  async getProfile(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['followers', 'following'],
    });
    if (!user) return null;

    const { passwordHash, resetPasswordToken, resetPasswordExpires, ...result } = user;
    return {
      ...result,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    };
  }
}
