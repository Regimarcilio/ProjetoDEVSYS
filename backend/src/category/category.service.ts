import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const category =
      await this.prisma.category.findUnique({
        where: {
          id,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Categoria não encontrada.',
      );
    }

    return category;
  }

  async create(
    data: Omit<CreateCategoryDto, 'companyId'>,
    companyId: string,
  ) {
    const company =
      await this.prisma.company.findUnique({
        where: {
          id: companyId,
        },
      });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    try {
      return await this.prisma.category.create({
        data: {
          ...data,
          companyId,
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma categoria com este nome nesta empresa.',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateCategoryDto,
  ) {
    await this.findOne(id);

    try {
      return await this.prisma.category.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe uma categoria com este nome nesta empresa.',
        );
      }

      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ) {
    await this.findOne(id);

    return this.prisma.category.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
