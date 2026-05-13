import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiParam, ApiProperty } from '@nestjs/swagger';
import { Tag } from './entities/tag.entity';

class CreateTagDto {
  @ApiProperty({ example: 'Technology' })
  name!: string;
  @ApiProperty({ example: 'technology' })
  slug!: string;
}

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiOkResponse({ type: [Tag], description: 'Returns a list of all tags' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Public()
  @Get(':slug/posts')
  @ApiOperation({ summary: 'Get posts by tag slug' })
  @ApiParam({ name: 'slug', description: 'Tag URL slug' })
  @ApiOkResponse({ description: 'Returns paginated list of posts for the tag' })
  findPostsByTag(@Param('slug') slug: string, @Query() paginationDto: PaginationDto, @CurrentUser() user?: any) {
    return this.tagsService.findPostsByTag(slug, paginationDto, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiOkResponse({ type: Tag, description: 'Tag created successfully' })
  create(@Body() data: CreateTagDto) {
    return this.tagsService.create(data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag (Admin only)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiOkResponse({ description: 'Tag deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}
