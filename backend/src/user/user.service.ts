import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async create(data: CreateUserDto) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: data.companyId,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    if (company.status !== 'ACTIVE') {
      throw new ConflictException(
        'Não é possível cadastrar usuário em uma empresa inativa.',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          companyId: data.companyId,
          name: data.name,
          email: data.email,
          passwordHash,
        },
        select: {
          id: true,
          companyId: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um usuário com este e-mail nesta empresa.',
        );
      }

      throw error;
    }
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id);

    const updateData: Prisma.UserUpdateInput = {
      name: data.name,
      email: data.email,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    try {
      return await this.prisma.user.update({
        where: {
          id,
        },
        data: updateData,
        select: {
          id: true,
          companyId: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um usuário com este e-mail nesta empresa.',
        );
      }

      throw error;
    }
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        status,
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
