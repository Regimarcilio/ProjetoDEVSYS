import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado.',
      );
    }

    return product;
  }

  async create(
    data: Omit<CreateProductDto, 'companyId'>,
    companyId: string,
  ) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    const category =
      await this.prisma.category.findUnique({
        where: {
          id: data.categoryId,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Categoria não encontrada.',
      );
    }

    if (category.companyId !== companyId) {
      throw new ConflictException(
        'A categoria não pertence à empresa informada.',
      );
    }

    try {
      return await this.prisma.product.create({
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
          'Já existe um produto com este código nesta empresa.',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateProductDto,
  ) {
    await this.findOne(id);

    try {
      return await this.prisma.product.update({
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
          'Já existe um produto com este código nesta empresa.',
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

    return this.prisma.product.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
