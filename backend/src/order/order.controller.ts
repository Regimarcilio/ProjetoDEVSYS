import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Request } from 'express';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderService } from './order.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    companyId: string;
    name: string;
    email: string;
    status: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.orderService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.orderService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.orderService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.orderService.update(id, dto, req.user.companyId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.orderService.updateStatus(
      id,
      dto.status as OrderStatus,
      req.user.companyId,
    );
  }
}
