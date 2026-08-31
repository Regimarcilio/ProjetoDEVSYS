import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id,
      },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    return company;
  }

  async create(data: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma empresa cadastrada com este documento.',
        );
      }

      throw error;
    }
  }

  async update(id: string, data: UpdateCompanyDto) {
    await this.findOne(id);

    try {
      return await this.prisma.company.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma empresa cadastrada com este documento.',
        );
      }

      throw error;
    }
  }
}
