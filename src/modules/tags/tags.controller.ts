import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Public()
  @Get(':slug/posts')
  findPostsByTag(@Param('slug') slug: string, @Query() paginationDto: PaginationDto, @CurrentUser() user?: any) {
    return this.tagsService.findPostsByTag(slug, paginationDto, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: { name: string; slug: string }) {
    return this.tagsService.create(data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}
