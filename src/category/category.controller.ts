import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Member } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentMember } from '../common/decorators/current-member.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '카테고리 목록 조회' })
  async getCategories(@CurrentMember() member: Member) {
    const categories = await this.categoryService.getCategories(member);
    return { categories };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '카테고리 생성' })
  async createCategory(
    @CurrentMember() member: Member,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.categoryService.createCategory(member, dto);
    return {
      id: category.id,
      category: category.category,
      message: '카테고리 생성 성공',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '카테고리 삭제' })
  @ApiParam({ name: 'id', type: Number })
  async deleteCategory(
    @CurrentMember() member: Member,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.categoryService.deleteCategory(member, id);
    return { message: '카테고리 삭제 성공' };
  }
}
