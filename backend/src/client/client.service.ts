import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    return client;
  }

  async create(
    data: Omit<CreateClientDto, 'companyId'>,
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

    try {
      return await this.prisma.client.create({
        data: {
          ...data,
          companyId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um cliente cadastrado com este documento nesta empresa.',
        );
      }

      throw error;
    }
  }

  async update(id: string, data: UpdateClientDto) {
    await this.findOne(id);

    try {
      return await this.prisma.client.update({
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
          'Já existe um cliente cadastrado com este documento nesta empresa.',
        );
      }

      throw error;
    }
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.findOne(id);

    return this.prisma.client.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
