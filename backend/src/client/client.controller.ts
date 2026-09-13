import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ClientService } from './client.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { UpdateClientStatusDto } from './dto/update-client-status.dto.js';

@Controller('clients')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
  ) {}

  @Get()
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateClientDto) {
  const { companyId, ...clientData } = data;

    return this.clientService.create(
      clientData,
      companyId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateClientDto,
  ) {
    return this.clientService.update(id, data);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateClientStatusDto,
  ) {
    return this.clientService.updateStatus(
      id,
      data.status,
    );
  }
}
