import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { CompanyService } from './company.service.js';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateCompanyDto) {
    return this.companyService.create(data);
  }
}
