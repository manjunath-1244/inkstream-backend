import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  NotFoundException,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from './entities/user.entity';
import { PostsService } from '../posts/posts.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: User, description: 'Returns current user data' })
  getMe(@CurrentUser() user: any): any {
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    type: User,
    description: 'User profile updated successfully',
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.update(user.id, updateProfileDto);
  }

  @Post('me/upgrade-to-creator')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade current user to creator role' })
  @ApiOkResponse({ description: 'User role updated to CREATOR' })
  async upgradeToCreator(@CurrentUser() user: any) {
    return this.usersService.updateRole(user.id, Role.CREATOR);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ description: 'User role updated successfully' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('role') role: Role,
  ) {
    return this.usersService.updateRole(id, role);
  }

  @Public()
  @Get(':username')
  @ApiOperation({ summary: 'Get user profile by username' })
  @ApiParam({ name: 'username', description: 'Unique username' })
  @ApiOkResponse({ type: User, description: 'Returns user profile data' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'Followed successfully' })
  async follow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.usersService.follow(user.id, id);
    return { message: 'Followed successfully' };
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'Unfollowed successfully' })
  async unfollow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.usersService.unfollow(user.id, id);
    return { message: 'Unfollowed successfully' };
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if following a user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ type: Boolean, description: 'Returns true if following' })
  async isFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.usersService.isFollowing(user.id, id);
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'User blocked successfully' })
  async block(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.usersService.block(user.id, id);
    return { message: 'User blocked successfully' };
  }

  @Post(':id/unblock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiOkResponse({ description: 'User unblocked successfully' })
  async unblock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.usersService.unblock(user.id, id);
    return { message: 'User unblocked successfully' };
  }

  @Public()
  @Get(':username/posts')
  @ApiOperation({ summary: 'Get all posts by a specific user' })
  @ApiParam({ name: 'username', description: 'User username' })
  @ApiOkResponse({ description: 'Returns paginated list of posts' })
  async getUserPosts(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return this.postsService.findByUser(user.id, paginationDto);
  }

  @Public()
  @Get(':username/followers')
  @ApiOperation({ summary: 'Get list of followers for a user' })
  @ApiParam({ name: 'username', description: 'User username' })
  @ApiOkResponse({
    type: [User],
    description: 'Returns array of follower users',
  })
  async getFollowers(@Param('username') username: string) {
    const user = await this.usersService.getProfile(username);
    if (!user) throw new NotFoundException('User not found');
    return user.followers;
  }

  @Public()
  @Get(':username/following')
  @ApiOperation({ summary: 'Get list of users followed by a user' })
  @ApiParam({ name: 'username', description: 'User username' })
  @ApiOkResponse({
    type: [User],
    description: 'Returns array of following users',
  })
  async getFollowing(@Param('username') username: string) {
    const user = await this.usersService.getProfile(username);
    if (!user) throw new NotFoundException('User not found');
    return user.following;
  }
}
