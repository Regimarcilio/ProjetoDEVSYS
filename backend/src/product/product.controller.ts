import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ProductService } from './product.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateProductStatusDto } from './dto/update-product-status.dto.js';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateProductDto) {
    const { companyId, ...productData } = data;

    return this.productService.create(
      productData,
      companyId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.productService.update(
      id,
      data,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateProductStatusDto,
  ) {
    return this.productService.updateStatus(
      id,
      data.status,
    );
  }
}
