import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderService } from './order.service.js';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get()
  findAll(
    @Query('companyId', new ParseUUIDPipe()) companyId: string,
  ) {
    return this.orderService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(
      id,
      dto.status as OrderStatus,
    );
  }
}
