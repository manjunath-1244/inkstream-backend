import { Injectable, NotFoundException } from '@nestjs/common';
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
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['following'] });
    const target = await this.findById(targetId);
    if (!user || !target) throw new NotFoundException('User not found');
    
    if (!user.following.some(u => u.id === targetId)) {
      user.following.push(target);
      await this.userRepository.save(user);
    }
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
