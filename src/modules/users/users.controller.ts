import { Controller, Get, Patch, Body, Param, NotFoundException, Post, Delete, HttpCode, HttpStatus, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from './entities/user.entity';
import { PostsService } from '../posts/posts.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

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

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('role') role: Role,
  ) {
    return this.usersService.updateRole(id, role);
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
  async follow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.usersService.follow(user.id, id);
    return { message: 'Followed successfully' };
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.usersService.unfollow(user.id, id);
    return { message: 'Unfollowed successfully' };
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  async isFollowing(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.usersService.isFollowing(user.id, id);
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async block(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.usersService.block(user.id, id);
    return { message: 'User blocked successfully' };
  }

  @Post(':id/unblock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unblock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.usersService.unblock(user.id, id);
    return { message: 'User unblocked successfully' };
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
