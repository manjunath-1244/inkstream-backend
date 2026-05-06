import { Controller, Get, Patch, Body, Param, NotFoundException, Post, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from './entities/user.entity';
import { PostsService } from '../posts/posts.service';
import { PaginationDto } from '../posts/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.update(user.id, updateProfileDto);
  }

  @Post('me/upgrade-to-creator')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async upgradeToCreator(@CurrentUser() user: any) {
    return this.usersService.updateRole(user.id, Role.CREATOR);
  }

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    const profile = await this.usersService.getProfile(username);
    if (!profile) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return profile;
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async follow(@Param('id') id: string, @CurrentUser() user: any) {
    await this.usersService.follow(user.id, id);
    return { message: 'Followed successfully' };
  }

  @Get(':username/posts')
  async getUserPosts(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return this.postsService.findByUser(user.id, paginationDto);
  }

  @Get(':username/followers')
  async getFollowers(@Param('username') username: string) {
    const user = await this.usersService.getProfile(username);
    if (!user) throw new NotFoundException('User not found');
    return user.followers;
  }

  @Get(':username/following')
  async getFollowing(@Param('username') username: string) {
    const user = await this.usersService.getProfile(username);
    if (!user) throw new NotFoundException('User not found');
    return user.following;
  }
}
