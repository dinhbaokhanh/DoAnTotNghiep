import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FilterTagDto } from './dto/filter-tag.dto';
import { GatewayAuthGuard } from '../common/guards/gateway-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * POST /tags — Tạo Tag (chỉ Admin/Mod)
   */
  @Post()
  @Roles('admin', 'moderator')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  /**
   * GET /tags — Danh sách Tag (Public)
   * Phân trang, tìm kiếm, mặc định sắp xếp trending
   */
  @Get()
  findAll(@Query() filter: FilterTagDto) {
    return this.tagsService.findAll(filter);
  }

  /**
   * GET /tags/:id — Chi tiết Tag (Public)
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findOne(id);
  }

  /**
   * PATCH /tags/:id — Cập nhật Tag (chỉ Admin/Mod)
   */
  @Patch(':id')
  @Roles('admin', 'moderator')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, dto);
  }

  /**
   * DELETE /tags/:id — Xóa Tag (chỉ Admin/Mod)
   * Sẽ bị từ chối nếu usage_count > 0
   */
  @Delete(':id')
  @Roles('admin', 'moderator')
  @UseGuards(GatewayAuthGuard, RolesGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}
