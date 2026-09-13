import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto.js';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
  ) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateCategoryDto) {
    const { companyId, ...categoryData } = data;

    return this.categoryService.create(
      categoryData,
      companyId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.categoryService.update(
      id,
      data,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateCategoryStatusDto,
  ) {
    return this.categoryService.updateStatus(
      id,
      data.status,
    );
  }
}
