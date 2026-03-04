import { Injectable, ConflictException } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(member: Member) {
    return this.prisma.category.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCategory(member: Member, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { memberId: member.id, category: dto.category },
    });
    if (existing) throw new ConflictException('이미 존재하는 카테고리입니다.');

    return this.prisma.category.create({
      data: {
        memberId: member.id,
        category: dto.category,
        createdAt: new Date(),
      },
    });
  }

  async deleteCategory(member: Member, categoryId: number) {
    await this.prisma.category.deleteMany({
      where: { id: categoryId, memberId: member.id },
    });
  }

  // 통계 모듈에서 사용
  async getCategoriesCreatedBetween(
    memberId: number,
    startAt: Date,
    endAt: Date,
  ) {
    return this.prisma.category.findMany({
      where: { memberId, createdAt: { gte: startAt, lte: endAt } },
    });
  }
}
